import { ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TrackEngagementDto } from './dto/track-engagement.dto';
import { resolvePagination, sanitizeKeyword } from '../common/pagination';
import { EntitlementsService } from '../subscriptions/entitlements.service';

// Confirmed real on the Zameen New Projects search page: City, Property
// Type (via the "Browse Projects by Category" taxonomy), Budget Range,
// Area Range, Project Title (keyword) and Developer Title filters, plus
// sort/pagination — mirrors ListingSearchFilters in
// listings/listings.repository.ts.
export interface ProjectSearchFilters {
  city?: string;
  area?: string;
  status?: 'planned' | 'under_construction' | 'ready' | 'draft';
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

const PROJECT_COLUMNS = `
  id, name, slug, description, city, area, status, possession_date, cover_image_url,
  gallery_image_urls, floor_plan_urls, video_url, brochure_url, verification_status, created_by, created_at,
  developers!inner (id, name, slug, logo_url, phone, whatsapp),
  project_unit_types (count)
`;

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
    galleryImageUrls: row.gallery_image_urls ?? [],
    floorPlanUrls: row.floor_plan_urls ?? [],
    videoUrl: row.video_url,
    brochureUrl: row.brochure_url,
    verificationStatus: row.verification_status,
    createdBy: row.created_by,
    // Search/manage list rows don't embed the full unit-type array (that's
    // findBySlug/findById's mapProjectDetailRow below) — just a count, via
    // PROJECT_COLUMNS' `project_unit_types (count)` embed.
    unitTypeCount: row.project_unit_types?.[0]?.count ?? 0,
    priceRange,
  };
}

// findBySlug's Supabase query (below) returns raw snake_case rows with
// nested join tables (project_unit_types, project_amenities,
// project_payment_plans) — this maps that into the same camelCase shape
// (Project, packages/core/src/models/index.ts) the search/list endpoints
// already return via mapProjectRow, which findBySlug previously skipped
// entirely (`return data` with no transform at all — a pre-existing gap
// this fix closes since it sits right next to the new media fields).
function mapProjectDetailRow(row: any) {
  const unitTypes = (row.project_unit_types ?? []).map((unit: any) => ({
    id: unit.id,
    label: unit.label,
    propertyType: unit.property_types && {
      slug: unit.property_types.slug,
      label: unit.property_types.label,
      // Needed by the Unit Types form's Category -> Property Type cascade
      // (apps/web/components/projects/ProjectForm.tsx) to preselect the
      // right category when editing an existing unit type — without this,
      // the embed omitted the category entirely and the edit form could
      // never resolve which category the saved property type belonged to.
      category: unit.property_types.property_type_categories,
    },
    areaValueMin: unit.area_value_min,
    areaValueMax: unit.area_value_max,
    areaUnit: unit.area_unit,
    priceMin: unit.price_min,
    priceMax: unit.price_max,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
  }));

  let priceRange: { min: number; max: number } | null = null;
  for (const unit of unitTypes) {
    if (unit.priceMin == null && unit.priceMax == null) continue;
    const min = unit.priceMin ?? unit.priceMax;
    const max = unit.priceMax ?? unit.priceMin;
    if (!priceRange) priceRange = { min, max };
    else {
      if (min < priceRange.min) priceRange.min = min;
      if (max > priceRange.max) priceRange.max = max;
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    developer: row.developers && {
      id: row.developers.id,
      name: row.developers.name,
      slug: row.developers.slug,
      logoUrl: row.developers.logo_url,
      description: row.developers.description,
      phone: row.developers.phone,
      whatsapp: row.developers.whatsapp,
      city: row.developers.city,
    },
    description: row.description,
    city: row.city,
    area: row.area,
    status: row.status,
    possessionDate: row.possession_date,
    coverImageUrl: row.cover_image_url,
    galleryImageUrls: row.gallery_image_urls ?? [],
    floorPlanUrls: row.floor_plan_urls ?? [],
    videoUrl: row.video_url,
    brochureUrl: row.brochure_url,
    verificationStatus: row.verification_status,
    createdBy: row.created_by,
    unitTypeCount: unitTypes.length,
    unitTypes,
    paymentPlans: (row.project_payment_plans ?? []).map((plan: any) => ({
      id: plan.id,
      label: plan.label,
      bookingPercent: plan.booking_percent,
      installmentCount: plan.installment_count,
      installmentFrequency: plan.installment_frequency,
      balloonPaymentCount: plan.balloon_payment_count,
      planDocumentUrl: plan.plan_document_url,
      description: plan.description,
    })),
    amenities: (row.project_amenities ?? [])
      .map((row: any) => row.amenities)
      .filter(Boolean)
      .map((amenity: any) => ({ slug: amenity.slug, label: amenity.label, category: amenity.category })),
    priceRange,
  };
}

// New Developments — Zameen-specific entity distinct from an individual
// listing (see supabase/migrations/0008_projects.sql). A project has many
// unit types; individual listings may optionally reference a project.
@Injectable()
export class ProjectsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // includeUnverified: set by the authenticated agent/super_admin "manage"
  // route (findAll below) — the public search route never sets this, so a
  // project an agent submitted stays invisible to public browsing until a
  // Super Admin approves it.
  async findPublic(filters: ProjectSearchFilters = {}, includeUnverified = false): Promise<PaginatedProjects> {
    const { page, pageSize } = resolvePagination(filters);

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

    if (!includeUnverified) query = query.eq('verification_status', 'verified');
    if (filters.city) query = query.eq('city', filters.city);
    // Fuzzy, not exact — same as ListingsRepository.searchPublic's area
    // filter (services/api/src/listings/listings.repository.ts:715), since
    // a Google Places suggestion ("Bahria Town, Islamabad") won't match the
    // area column's raw stored value character-for-character.
    if (filters.area) query = query.ilike('area', `%${filters.area}%`);
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

  private readonly detailSelect = `*,
        developers (id, name, slug, logo_url, description, phone, whatsapp, city),
        project_unit_types (id, label, area_value_min, area_value_max, area_unit, price_min, price_max, bedrooms, bathrooms, property_types (slug, label, property_type_categories (slug, label))),
        project_amenities (amenities (slug, label, category)),
        project_payment_plans (id, label, booking_percent, installment_count, installment_frequency, balloon_payment_count, plan_document_url, description)`;

  async findBySlug(slug: string) {
    const { data, error } = await this.supabase.client.from('projects').select(this.detailSelect).eq('slug', slug).single();
    if (error) throw error;
    return mapProjectDetailRow(data);
  }

  // Agent/Super Admin detail fetch (by id, not slug) — backs the
  // /admin/projects/[id] and /projects/[id] edit/view pages, which need a
  // project regardless of its verification_status (findBySlug above has no
  // such restriction either, but is keyed by slug, not the id the list rows
  // carry).
  async findById(id: string) {
    const { data, error } = await this.supabase.client.from('projects').select(this.detailSelect).eq('id', id).single();
    if (error) throw error;
    return mapProjectDetailRow(data);
  }

  // Shared by create()/update() below — resolves propertyTypeSlug ->
  // property_type_id and (re)inserts project_unit_types/
  // project_payment_plans/project_amenities. update() calls this after
  // deleting the project's existing child rows, so this always starts from
  // empty for that project — same "submit replaces everything" semantics
  // the create-form's full-page submit already has.
  private async insertChildRows(
    projectId: string,
    input: Pick<CreateProjectDto, 'unitTypes' | 'paymentPlans' | 'amenitySlugs'>,
  ) {
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
          project_id: projectId,
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
          project_id: projectId,
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
          .insert(amenities.map((amenity: any) => ({ project_id: projectId, amenity_id: amenity.id })));
        if (linkError) throw linkError;
      }
    }
  }

  // creatorRole: a super_admin-authored project is auto-verified (they're
  // the same authority that would otherwise approve it); an agent-authored
  // one starts 'pending' and stays out of public search until approved via
  // setVerificationStatus below — same publish gate listings already have.
  async create(
    input: CreateProjectDto,
    creatorRole: 'agent' | 'super_admin',
    creatorId: string,
    agentId?: string,
  ) {
    // Real quota enforcement, mirroring ListingsRepository.create()'s
    // entitlements check — super_admin-created projects have no plan to
    // check against, same as owner-submitted listings. Row-count is keyed
    // on creatorId (what `created_by` actually stores — see
    // EntitlementsService.getProjectUsage's comment), tier lookup on agentId.
    if (creatorRole === 'agent' && agentId) {
      const allowed = await this.entitlements.canCreateProject(agentId, creatorId);
      if (!allowed) {
        throw new ForbiddenException('Project quota reached for your current plan — upgrade or free up a slot.');
      }
    }

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
        gallery_image_urls: input.galleryImageUrls ?? [],
        floor_plan_urls: input.floorPlanUrls ?? [],
        video_url: input.videoUrl,
        brochure_url: input.brochureUrl,
        verification_status:
          input.status === 'draft' ? 'draft' : creatorRole === 'super_admin' ? 'verified' : 'pending',
        created_by: creatorId,
      })
      .select()
      .single();
    if (error) throw error;

    await this.insertChildRows(project.id, input);

    return project;
  }

  // Ownership check backing ProjectsController.assertOwnProject — mirrors
  // ListingsController.assertOwnListing/ListingsRepository.getOwnership.
  async getOwnership(id: string): Promise<{ createdBy: string | null; verificationStatus: string }> {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select('created_by, verification_status')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { createdBy: (data as any).created_by, verificationStatus: (data as any).verification_status };
  }

  // Full-page-form edit — agent (self-scoped to their own project, enforced
  // by ProjectsController.assertOwnProject) or super_admin (any). Editing a
  // 'rejected' project always resets it to 'pending' regardless of who
  // edited it — same re-review-on-edit rule as ListingsRepository.update.
  // A 'verified' project now keeps its status through edits instead — no
  // plan-driven expiry exists for projects today (unlike listings), so
  // there's nothing else that would move it out of 'verified' on its own;
  // forcing every routine edit back through review was the actual bug, not
  // the fresh-look intent behind the rejected-item case.
  async update(id: string, input: UpdateProjectDto) {
    const { data: existing, error: existingError } = await this.supabase.client
      .from('projects')
      .select('verification_status')
      .eq('id', id)
      .single();
    if (existingError) throw existingError;

    // A draft moving to a real status goes through review like any other
    // first-time submission — update() has no creatorRole (unlike
    // create()), so this can't distinguish an agent finishing their own
    // draft from a super_admin doing the same; 'pending' is the safe
    // default either way.
    const nextVerificationStatus =
      input.status === 'draft'
        ? 'draft'
        : existing.verification_status === 'draft' || existing.verification_status === 'rejected'
          ? 'pending'
          : existing.verification_status;

    const updatePayload: Record<string, unknown> = { verification_status: nextVerificationStatus };
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.developerId !== undefined) updatePayload.developer_id = input.developerId;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.area !== undefined) updatePayload.area = input.area;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.possessionDate !== undefined) updatePayload.possession_date = input.possessionDate;
    if (input.coverImageUrl !== undefined) updatePayload.cover_image_url = input.coverImageUrl;
    if (input.galleryImageUrls !== undefined) updatePayload.gallery_image_urls = input.galleryImageUrls;
    if (input.floorPlanUrls !== undefined) updatePayload.floor_plan_urls = input.floorPlanUrls;
    if (input.videoUrl !== undefined) updatePayload.video_url = input.videoUrl;
    if (input.brochureUrl !== undefined) updatePayload.brochure_url = input.brochureUrl;

    const { error: updateError } = await this.supabase.client.from('projects').update(updatePayload).eq('id', id);
    if (updateError) throw updateError;

    if (input.unitTypes !== undefined) {
      const { error: deleteError } = await this.supabase.client.from('project_unit_types').delete().eq('project_id', id);
      if (deleteError) throw deleteError;
    }
    if (input.paymentPlans !== undefined) {
      const { error: deleteError } = await this.supabase.client.from('project_payment_plans').delete().eq('project_id', id);
      if (deleteError) throw deleteError;
    }
    if (input.amenitySlugs !== undefined) {
      const { error: deleteError } = await this.supabase.client.from('project_amenities').delete().eq('project_id', id);
      if (deleteError) throw deleteError;
    }

    await this.insertChildRows(id, input);

    return this.findById(id);
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('projects').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }

  // Super Admin approve/reject action — mirrors
  // AgenciesRepository.setVerificationStatus's simple direct-update shape
  // (no audit-log RPC like listings' heavier verification flow needs).
  async setVerificationStatus(id: string, status: 'verified' | 'rejected') {
    const { data, error } = await this.supabase.client
      .from('projects')
      .update({ verification_status: status })
      .eq('id', id)
      .select(PROJECT_COLUMNS)
      .single();
    if (error) throw error;
    return mapProjectRow(data, null);
  }

  // Mirrors ListingsRepository.trackEngagement — same
  // view/click/call/whatsapp/sms/email event shape, scoped to
  // project_engagement_events instead of listing_engagement_events.
  async trackEngagement(projectId: string, input: TrackEngagementDto) {
    const { error } = await this.supabase.client.from('project_engagement_events').insert({
      project_id: projectId,
      type: input.type,
      platform: input.platform,
      viewer_session_id: input.viewerSessionId,
    });
    if (error) throw error;
  }
}
