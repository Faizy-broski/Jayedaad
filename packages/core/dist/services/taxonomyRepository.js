import { httpClient } from './httpClient';
// services/api/src/taxonomy/taxonomy.repository.ts returns raw snake_case
// rows for the admin CRUD endpoints (no server-side mapper) — mapped here.
function mapCategoryRow(row) {
    return { id: row.id, slug: row.slug, label: row.label, sortOrder: row.sort_order };
}
function mapPropertyTypeRow(row) {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        category: { slug: row.property_type_categories?.slug, label: row.property_type_categories?.label },
    };
}
function mapAmenityRow(row) {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        category: row.category,
        valueType: row.value_type,
        valueUnit: row.value_unit,
        options: row.options,
        propertyTypeCategories: (row.property_type_categories ?? []).map((c) => ({ slug: c.slug, label: c.label })),
    };
}
export const taxonomyRepository = {
    listCategories: async () => {
        const { data } = await httpClient.get('/taxonomy/property-type-categories');
        return data.map(mapCategoryRow);
    },
    listPropertyTypes: async () => {
        const { data } = await httpClient.get('/taxonomy/property-types');
        return data;
    },
    // propertyTypeCategorySlug lets a listing-submission form only fetch
    // amenities relevant to the property type being listed (e.g. Plots don't
    // get Drawing Room/Servant Quarters).
    listAmenities: async (propertyTypeCategorySlug) => {
        const { data } = await httpClient.get('/taxonomy/amenities', { params: { propertyTypeCategorySlug } });
        return data;
    },
    // Super Admin-only taxonomy CRUD.
    createCategory: async (input) => {
        const { data } = await httpClient.post('/taxonomy/property-type-categories', input);
        return mapCategoryRow(data);
    },
    updateCategory: async (id, input) => {
        const { data } = await httpClient.patch(`/taxonomy/property-type-categories/${id}`, input);
        return mapCategoryRow(data);
    },
    removeCategory: async (id) => {
        await httpClient.delete(`/taxonomy/property-type-categories/${id}`);
    },
    createPropertyType: async (input) => {
        const { data } = await httpClient.post('/taxonomy/property-types', input);
        return mapPropertyTypeRow(data);
    },
    updatePropertyType: async (id, input) => {
        const { data } = await httpClient.patch(`/taxonomy/property-types/${id}`, input);
        return mapPropertyTypeRow(data);
    },
    removePropertyType: async (id) => {
        await httpClient.delete(`/taxonomy/property-types/${id}`);
    },
    createAmenity: async (input) => {
        const { data } = await httpClient.post('/taxonomy/amenities', input);
        return mapAmenityRow(data);
    },
    updateAmenity: async (id, input) => {
        const { data } = await httpClient.patch(`/taxonomy/amenities/${id}`, input);
        return mapAmenityRow(data);
    },
    removeAmenity: async (id) => {
        await httpClient.delete(`/taxonomy/amenities/${id}`);
    },
};
