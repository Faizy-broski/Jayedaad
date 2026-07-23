import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';

// Confirmed real on the Zameen New Projects search page: City, Property
// Type (via the "Browse Projects by Category" taxonomy), Budget Range,
// Area Range, Project Title (keyword) and Developer Title filters, plus
// sort/pagination — mirrors ListingSearchFilters in
// listings/listings.repository.ts.
export interface ProjectSearchFilters {
  city?: string;
  status?: 'planned' | 'under_construction' | 'ready';
  propertyTypeSlug?: string;
  developerSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
  keyword?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedProjects {
  items: ReturnType<typeof mapProjectRow>[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const PROJECT_COLUMNS = `
  id, name, slug, description, city, area, status, possession_date, cover_image_url, created_at,
  developers!inner (id, name, slug, logo_url, phone, whatsapp)
`;

// PostgREST's .or() filter string is itself a small DSL — strip characters
// that are syntactically significant in it (or in ILIKE patterns) rather
// than interpolate a raw user string into the filter (same discipline as
// listings.repository.ts::sanitizeKeyword).
function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[,()%]/g, ' ').trim();
}

function mapProjectRow(row: any, priceRange: { min: number; max: number } | null) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    developer: row.developers && {
      id: row.developers.id,
      name: row.developers.name,
      slug: row.developers.slug,
      logoUrl: row.developers.logo_url,
      phone: row.developers.phone,
      whatsapp: row.developers.whatsapp,
    },
    description: row.description,
    city: row.city,
    area: row.area,
    status: row.status,
    possessionDate: row.possession_date,
    coverImageUrl: row.cover_image_url,
    priceRange,
  };
}

// New Developments — Zameen-specific entity distinct from an individual
// listing (see supabase/migrations/0008_projects.sql). A project has many
// unit types; individual listings may optionally reference a project.
@Injectable()
export class ProjectsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findPublic(filters: ProjectSearchFilters = {}): Promise<PaginatedProjects> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    // Budget/area/category filters live on project_unit_types (a child
    // table), not on projects directly — resolved as one combined
    // pre-lookup (not independent existence checks) so a project only
    // matches when a SINGLE unit type satisfies category + price + area
    // together, not when different unit types independently satisfy each.
    let eligibleProjectIds: string[] | undefined;
    const needsUnitTypeLookup =
      !!filters.propertyTypeSlug ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.minAreaValue != null ||
      filters.maxAreaValue != null;

    if (needsUnitTypeLookup) {
      let unitQuery = this.supabase.client
        .from('project_unit_types')
        .select('project_id, property_types!inner (slug)');

      if (filters.propertyTypeSlug) unitQuery = unitQuery.eq('property_types.slug', filters.propertyTypeSlug);
      // Range-overlap: a unit type matches if its [price_min, price_max] /
      // [area_value_min, area_value_max] span overlaps the requested range.
      if (filters.minPrice != null) unitQuery = unitQuery.gte('price_max', filters.minPrice);
      if (filters.maxPrice != null) unitQuery = unitQuery.lte('price_min', filters.maxPrice);
      if (filters.minAreaValue != null) unitQuery = unitQuery.gte('area_value_max', filters.minAreaValue);
      if (filters.maxAreaValue != null) unitQuery = unitQuery.lte('area_value_min', filters.maxAreaValue);
      if (filters.areaUnit) unitQuery = unitQuery.eq('area_unit', filters.areaUnit);

      const { data, error } = await unitQuery;
      if (error) throw error;
      eligibleProjectIds = Array.from(new Set((data ?? []).map((r: any) => r.project_id)));
      if (eligibleProjectIds.length === 0) return { items: [], total: 0, page, pageSize };
    }

    let query = this.supabase.client.from('projects').select(PROJECT_COLUMNS, { count: 'exact' });

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.developerSlug) query = query.eq('developers.slug', filters.developerSlug);
    if (filters.keyword) {
      const term = sanitizeKeyword(filters.keyword);
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (eligibleProjectIds) query = query.in('id', eligibleProjectIds);

    // price_asc/price_desc sort against a value that's computed from a
    // child table, never stored — can't be pushed down to a DB-level
    // .order()/.range() the way `newest` can, so those two sort modes
    // fetch the full filtered set and paginate in-app; `newest` (the
    // default) stays fully DB-paginated.
    const sortsByPrice = filters.sortBy === 'price_asc' || filters.sortBy === 'price_desc';
    if (!sortsByPrice) {
      query = query.order('created_at', { ascending: false });
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const priceRangeByProject = await this.getPriceRangeByProject(rows.map((r: any) => r.id));

    if (!sortsByPrice) {
      return {
        items: rows.map((row: any) => mapProjectRow(row, priceRangeByProject.get(row.id) ?? null)),
        total: count ?? 0,
        page,
        pageSize,
      };
    }

    const sorted = [...rows].sort((a: any, b: any) => {
      const aPrice = priceRangeByProject.get(a.id)?.min ?? 0;
      const bPrice = priceRangeByProject.get(b.id)?.min ?? 0;
      return filters.sortBy === 'price_asc' ? aPrice - bPrice : bPrice - aPrice;
    });
    const from = (page - 1) * pageSize;
    const pageRows = sorted.slice(from, from + pageSize);

    return {
      items: pageRows.map((row: any) => mapProjectRow(row, priceRangeByProject.get(row.id) ?? null)),
      total: sorted.length,
      page,
      pageSize,
    };
  }

  // Project-level price range shown on real Zameen pages ("PKR 3.08 Cr to
  // 32.1 Cr") — computed here from unit types, never stored on the project row.
  private async getPriceRangeByProject(projectIds: string[]): Promise<Map<string, { min: number; max: number }>> {
    const priceRangeByProject = new Map<string, { min: number; max: number }>();
    if (projectIds.length === 0) return priceRangeByProject;

    const { data: unitTypeRows, error } = await this.supabase.client
      .from('project_unit_types')
      .select('project_id, price_min, price_max')
      .in('project_id', projectIds);
    if (error) throw error;

    for (const row of unitTypeRows ?? []) {
      const projectId = (row as any).project_id;
      const min = (row as any).price_min;
      const max = (row as any).price_max;
      if (min == null && max == null) continue;
      const existing = priceRangeByProject.get(projectId);
      if (!existing) {
        priceRangeByProject.set(projectId, { min: min ?? max, max: max ?? min });
      } else {
        if (min != null && min < existing.min) existing.min = min;
        if (max != null && max > existing.max) existing.max = max;
      }
    }
    return priceRangeByProject;
  }

  // Backs "Browse Projects by City" — confirmed real on the Zameen New
  // Projects page (Islamabad 285, Lahore 219, Karachi 184, Rawalpindi 71, ...).
  async listCitiesWithCounts(): Promise<{ city: string; count: number }[]> {
    const { data, error } = await this.supabase.client.from('projects').select('city');
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const city = (row as any).city as string;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Backs "Browse Projects by Category" — confirmed real (Flats 486, Plots
  // 427, Shops 310, Houses 165, ...). Reuses the same property_types
  // taxonomy already built for regular listings rather than a second,
  // project-only category system. A mixed-use project (offering both Flats
  // and Shops unit types) counts once per category it offers, matching
  // Zameen's own behavior.
  async listCategoriesWithCounts(): Promise<{ propertyType: { slug: string; label: string }; count: number }[]> {
    const { data, error } = await this.supabase.client
      .from('project_unit_types')
      .select('project_id, property_types!inner (slug, label)');
    if (error) throw error;

    const projectIdsByType = new Map<string, { slug: string; label: string; projectIds: Set<string> }>();
    for (const row of data ?? []) {
      const propertyType = (row as any).property_types;
      const projectId = (row as any).project_id;
      const entry = projectIdsByType.get(propertyType.slug) ?? {
        slug: propertyType.slug,
        label: propertyType.label,
        projectIds: new Set<string>(),
      };
      entry.projectIds.add(projectId);
      projectIdsByType.set(propertyType.slug, entry);
    }

    return Array.from(projectIdsByType.values())
      .map((entry) => ({ propertyType: { slug: entry.slug, label: entry.label }, count: entry.projectIds.size }))
      .sort((a, b) => b.count - a.count);
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select(
        `*,
        developers (id, name, slug, logo_url, description, phone, whatsapp, city),
        project_unit_types (id, label, area_value_min, area_value_max, area_unit, price_min, price_max, bedrooms, bathrooms, property_types (slug, label)),
        project_amenities (amenities (slug, label, category)),
        project_payment_plans (id, label, booking_percent, installment_count, installment_frequency, balloon_payment_count, plan_document_url, description)`,
      )
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  async create(input: CreateProjectDto) {
    const { data: project, error } = await this.supabase.client
      .from('projects')
      .insert({
        name: input.name,
        slug: input.slug,
        developer_id: input.developerId,
        description: input.description,
        city: input.city,
        area: input.area,
        status: input.status ?? 'planned',
        possession_date: input.possessionDate,
        cover_image_url: input.coverImageUrl,
      })
      .select()
      .single();
    if (error) throw error;

    if (input.unitTypes?.length) {
      const slugs = Array.from(new Set(input.unitTypes.map((unit) => unit.propertyTypeSlug)));
      const { data: propertyTypes, error: propertyTypesError } = await this.supabase.client
        .from('property_types')
        .select('id, slug')
        .in('slug', slugs);
      if (propertyTypesError) throw propertyTypesError;

      const propertyTypeIdBySlug = new Map((propertyTypes ?? []).map((pt: any) => [pt.slug, pt.id]));

      const { error: unitTypesError } = await this.supabase.client.from('project_unit_types').insert(
        input.unitTypes.map((unit) => ({
          project_id: project.id,
          property_type_id: propertyTypeIdBySlug.get(unit.propertyTypeSlug),
          label: unit.label,
          area_value_min: unit.areaValueMin,
          area_value_max: unit.areaValueMax,
          area_unit: unit.areaUnit,
          price_min: unit.priceMin,
          price_max: unit.priceMax,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
        })),
      );
      if (unitTypesError) throw unitTypesError;
    }

    if (input.paymentPlans?.length) {
      const { error: paymentPlansError } = await this.supabase.client.from('project_payment_plans').insert(
        input.paymentPlans.map((plan) => ({
          project_id: project.id,
          label: plan.label,
          booking_percent: plan.bookingPercent,
          installment_count: plan.installmentCount,
          installment_frequency: plan.installmentFrequency,
          balloon_payment_count: plan.balloonPaymentCount,
          plan_document_url: plan.planDocumentUrl,
          description: plan.description,
        })),
      );
      if (paymentPlansError) throw paymentPlansError;
    }

    if (input.amenitySlugs?.length) {
      const { data: amenities, error: amenitiesError } = await this.supabase.client
        .from('amenities')
        .select('id')
        .in('slug', input.amenitySlugs);
      if (amenitiesError) throw amenitiesError;

      if (amenities?.length) {
        const { error: linkError } = await this.supabase.client
          .from('project_amenities')
          .insert(amenities.map((amenity: any) => ({ project_id: project.id, amenity_id: amenity.id })));
        if (linkError) throw linkError;
      }
    }

    return project;
  }
}
