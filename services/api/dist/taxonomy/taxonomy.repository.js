"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaxonomyRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxonomyRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// Property-type categories, property types, and amenities are all Super
// Admin-managed lookup tables, not hardcoded enums — per [Reqs §9]
// "taxonomy management". Mutations are gated to super_admin at the
// controller level (see taxonomy.controller.ts); reads are public since
// every listing search screen needs these lists to render its filters.
let TaxonomyRepository = class TaxonomyRepository {
    static { TaxonomyRepository_1 = this; }
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    // --- Property type categories (Homes/Plots/Commercial) --------------------
    async listCategories() {
        const { data, error } = await this.supabase.client
            .from('property_type_categories')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async createCategory(input) {
        const { data, error } = await this.supabase.client
            .from('property_type_categories')
            .insert({ slug: input.slug, label: input.label, sort_order: input.sortOrder ?? 0 })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateCategory(id, input) {
        const { data, error } = await this.supabase.client
            .from('property_type_categories')
            .update({ slug: input.slug, label: input.label, sort_order: input.sortOrder })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Blocked by the FK from property_types.category_id if types still
    // reference this category — surfaces as a Postgres FK-violation error
    // rather than silently orphaning types, which is the correct behavior.
    async removeCategory(id) {
        const { error } = await this.supabase.client.from('property_type_categories').delete().eq('id', id);
        if (error)
            throw error;
    }
    // --- Property types ---------------------------------------------------------
    async listPropertyTypes() {
        const { data, error } = await this.supabase.client
            .from('property_types')
            .select('*, property_type_categories (id, slug, label)')
            .order('sort_order', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    async createPropertyType(input) {
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
        if (error)
            throw error;
        return data;
    }
    async updatePropertyType(id, input) {
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
        if (error)
            throw error;
        return data;
    }
    async removePropertyType(id) {
        const { error } = await this.supabase.client.from('property_types').delete().eq('id', id);
        if (error)
            throw error;
    }
    // --- Amenities -----------------------------------------------------------
    static AMENITY_COLUMNS = '*, amenity_property_type_categories (property_type_categories (id, slug, label))';
    // propertyTypeCategorySlug backs the listing-submission form: only offer
    // amenities relevant to the property type being listed (confirmed a real
    // gap — every amenity used to be offered for every property type,
    // regardless of relevance, e.g. Drawing Room on a Plot submission).
    async listAmenities(filters = {}) {
        let eligibleAmenityIds;
        if (filters.propertyTypeCategorySlug) {
            const { data: category, error: categoryError } = await this.supabase.client
                .from('property_type_categories')
                .select('id')
                .eq('slug', filters.propertyTypeCategorySlug)
                .maybeSingle();
            if (categoryError)
                throw categoryError;
            if (!category)
                return [];
            const { data: links, error: linksError } = await this.supabase.client
                .from('amenity_property_type_categories')
                .select('amenity_id')
                .eq('property_type_category_id', category.id);
            if (linksError)
                throw linksError;
            eligibleAmenityIds = Array.from(new Set((links ?? []).map((r) => r.amenity_id)));
            if (eligibleAmenityIds.length === 0)
                return [];
        }
        let query = this.supabase.client
            .from('amenities')
            .select(TaxonomyRepository_1.AMENITY_COLUMNS)
            .order('sort_order', { ascending: true });
        if (eligibleAmenityIds)
            query = query.in('id', eligibleAmenityIds);
        const { data, error } = await query;
        if (error)
            throw error;
        return (data ?? []).map(mapAmenityRow);
    }
    async createAmenity(input) {
        const { data, error } = await this.supabase.client
            .from('amenities')
            .insert({
            slug: input.slug,
            label: input.label,
            category: input.category,
            value_unit: input.valueUnit,
            sort_order: input.sortOrder ?? 0,
        })
            .select('id')
            .single();
        if (error)
            throw error;
        await this.syncAmenityCategoryLinks(data.id, input.propertyTypeCategoryIds);
        return this.findAmenityById(data.id);
    }
    async updateAmenity(id, input) {
        const { error } = await this.supabase.client
            .from('amenities')
            .update({
            slug: input.slug,
            label: input.label,
            category: input.category,
            value_unit: input.valueUnit,
            sort_order: input.sortOrder,
        })
            .eq('id', id);
        if (error)
            throw error;
        if (input.propertyTypeCategoryIds) {
            await this.syncAmenityCategoryLinks(id, input.propertyTypeCategoryIds);
        }
        return this.findAmenityById(id);
    }
    async removeAmenity(id) {
        const { error } = await this.supabase.client.from('amenities').delete().eq('id', id);
        if (error)
            throw error;
    }
    async findAmenityById(id) {
        const { data, error } = await this.supabase.client
            .from('amenities')
            .select(TaxonomyRepository_1.AMENITY_COLUMNS)
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return mapAmenityRow(data);
    }
    // Delete-all-then-reinsert — same bulk-link sync approach already used for
    // project_amenities in projects.repository.ts::create().
    async syncAmenityCategoryLinks(amenityId, categoryIds) {
        const { error: deleteError } = await this.supabase.client
            .from('amenity_property_type_categories')
            .delete()
            .eq('amenity_id', amenityId);
        if (deleteError)
            throw deleteError;
        if (categoryIds?.length) {
            const { error: insertError } = await this.supabase.client.from('amenity_property_type_categories').insert(categoryIds.map((categoryId) => ({ amenity_id: amenityId, property_type_category_id: categoryId })));
            if (insertError)
                throw insertError;
        }
    }
};
exports.TaxonomyRepository = TaxonomyRepository;
exports.TaxonomyRepository = TaxonomyRepository = TaxonomyRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TaxonomyRepository);
function mapAmenityRow(row) {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        category: row.category,
        valueUnit: row.value_unit,
        propertyTypeCategories: (row.amenity_property_type_categories ?? []).map((link) => link.property_type_categories),
        sortOrder: row.sort_order,
    };
}
