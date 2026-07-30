import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropertyTypeCategoryDto, UpdatePropertyTypeCategoryDto } from './dto/category.dto';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from './dto/property-type.dto';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/amenity.dto';

// Property-type categories, property types, and amenities are all Super
// Admin-managed lookup tables, not hardcoded enums — per [Reqs §9]
// "taxonomy management". Mutations are gated to super_admin at the
// controller level (see taxonomy.controller.ts); reads are public since
// every listing search screen needs these lists to render its filters.
@Injectable()
export class TaxonomyRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // --- Property type categories (Homes/Plots/Commercial) --------------------

  async listCategories() {
    const { data, error } = await this.supabase.client
      .from('property_type_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  }

  async createCategory(input: CreatePropertyTypeCategoryDto) {
    const { data, error } = await this.supabase.client
      .from('property_type_categories')
      .insert({ slug: input.slug, label: input.label, sort_order: input.sortOrder ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, input: UpdatePropertyTypeCategoryDto) {
    const { data, error } = await this.supabase.client
      .from('property_type_categories')
      .update({ slug: input.slug, label: input.label, sort_order: input.sortOrder })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Blocked by the FK from property_types.category_id if types still
  // reference this category — surfaces as a Postgres FK-violation error
  // rather than silently orphaning types, which is the correct behavior.
  async removeCategory(id: string) {
    const { error } = await this.supabase.client.from('property_type_categories').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Property types ---------------------------------------------------------

  // Supabase's implicit-join syntax nests the related row under the TABLE
  // name (property_type_categories), not the `category` key packages/core's
  // PropertyType model expects — every caller below was silently shipping
  // `category: undefined` until something actually read `.category` (the
  // web submit page's category tabs, which is what surfaced this).
  private mapPropertyTypeRow(row: any) {
    const { property_type_categories, ...rest } = row;
    return { ...rest, category: property_type_categories };
  }

  async listPropertyTypes() {
    const { data, error } = await this.supabase.client
      .from('property_types')
      .select('*, property_type_categories (id, slug, label)')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data.map((row) => this.mapPropertyTypeRow(row));
  }

  async createPropertyType(input: CreatePropertyTypeDto) {
    const { data, error } = await this.supabase.client
      .from('property_types')
      .insert({
        slug: input.slug,
        label: input.label,
        category_id: input.categoryId,
        sort_order: input.sortOrder ?? 0,
      })
      .select('*, property_type_categories (id, slug, label)')
      .single();
    if (error) throw error;
    return this.mapPropertyTypeRow(data);
  }

  async updatePropertyType(id: string, input: UpdatePropertyTypeDto) {
    const { data, error } = await this.supabase.client
      .from('property_types')
      .update({
        slug: input.slug,
        label: input.label,
        category_id: input.categoryId,
        sort_order: input.sortOrder,
      })
      .eq('id', id)
      .select('*, property_type_categories (id, slug, label)')
      .single();
    if (error) throw error;
    return this.mapPropertyTypeRow(data);
  }

  async removePropertyType(id: string) {
    const { error } = await this.supabase.client.from('property_types').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Amenities -----------------------------------------------------------

  private static readonly AMENITY_COLUMNS =
    '*, amenity_property_type_categories (property_type_categories (id, slug, label))';

  // propertyTypeCategorySlug backs the listing-submission form: only offer
  // amenities relevant to the property type being listed (confirmed a real
  // gap — every amenity used to be offered for every property type,
  // regardless of relevance, e.g. Drawing Room on a Plot submission).
  async listAmenities(filters: { propertyTypeCategorySlug?: string } = {}) {
    let eligibleAmenityIds: string[] | undefined;
    if (filters.propertyTypeCategorySlug) {
      const { data: category, error: categoryError } = await this.supabase.client
        .from('property_type_categories')
        .select('id')
        .eq('slug', filters.propertyTypeCategorySlug)
        .maybeSingle();
      if (categoryError) throw categoryError;
      if (!category) return [];

      const { data: links, error: linksError } = await this.supabase.client
        .from('amenity_property_type_categories')
        .select('amenity_id')
        .eq('property_type_category_id', category.id);
      if (linksError) throw linksError;

      eligibleAmenityIds = Array.from(new Set((links ?? []).map((r: any) => r.amenity_id)));
      if (eligibleAmenityIds.length === 0) return [];
    }

    let query = this.supabase.client
      .from('amenities')
      .select(TaxonomyRepository.AMENITY_COLUMNS)
      .order('sort_order', { ascending: true });
    if (eligibleAmenityIds) query = query.in('id', eligibleAmenityIds);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapAmenityRow);
  }

  async createAmenity(input: CreateAmenityDto) {
    const { data, error } = await this.supabase.client
      .from('amenities')
      .insert({
        slug: input.slug,
        label: input.label,
        category: input.category,
        value_type: input.valueType,
        value_unit: input.valueUnit,
        options: input.options,
        sort_order: input.sortOrder ?? 0,
      })
      .select('id')
      .single();
    if (error) throw error;

    await this.syncAmenityCategoryLinks(data.id, input.propertyTypeCategoryIds);
    return this.findAmenityById(data.id);
  }

  async updateAmenity(id: string, input: UpdateAmenityDto) {
    const { error } = await this.supabase.client
      .from('amenities')
      .update({
        slug: input.slug,
        label: input.label,
        category: input.category,
        value_type: input.valueType,
        value_unit: input.valueUnit,
        options: input.options,
        sort_order: input.sortOrder,
      })
      .eq('id', id);
    if (error) throw error;

    if (input.propertyTypeCategoryIds) {
      await this.syncAmenityCategoryLinks(id, input.propertyTypeCategoryIds);
    }
    return this.findAmenityById(id);
  }

  async removeAmenity(id: string) {
    const { error } = await this.supabase.client.from('amenities').delete().eq('id', id);
    if (error) throw error;
  }

  private async findAmenityById(id: string) {
    const { data, error } = await this.supabase.client
      .from('amenities')
      .select(TaxonomyRepository.AMENITY_COLUMNS)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapAmenityRow(data);
  }

  // Delete-all-then-reinsert — same bulk-link sync approach already used for
  // project_amenities in projects.repository.ts::create().
  private async syncAmenityCategoryLinks(amenityId: string, categoryIds?: string[]) {
    const { error: deleteError } = await this.supabase.client
      .from('amenity_property_type_categories')
      .delete()
      .eq('amenity_id', amenityId);
    if (deleteError) throw deleteError;

    if (categoryIds?.length) {
      const { error: insertError } = await this.supabase.client.from('amenity_property_type_categories').insert(
        categoryIds.map((categoryId) => ({ amenity_id: amenityId, property_type_category_id: categoryId })),
      );
      if (insertError) throw insertError;
    }
  }
}

function mapAmenityRow(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    category: row.category,
    valueType: row.value_type,
    valueUnit: row.value_unit,
    options: row.options,
    propertyTypeCategories: (row.amenity_property_type_categories ?? []).map(
      (link: any) => link.property_type_categories,
    ),
    sortOrder: row.sort_order,
  };
}
