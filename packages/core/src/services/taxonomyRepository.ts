import { httpClient } from './httpClient';
import {
  Amenity,
  CreateAmenityInput,
  CreatePropertyTypeCategoryInput,
  CreatePropertyTypeInput,
  PropertyType,
  PropertyTypeCategory,
  UpdateAmenityInput,
  UpdatePropertyTypeCategoryInput,
  UpdatePropertyTypeInput,
} from '../models';

// services/api/src/taxonomy/taxonomy.repository.ts returns raw snake_case
// rows for the admin CRUD endpoints (no server-side mapper) — mapped here.
function mapCategoryRow(row: any): PropertyTypeCategory {
  return { id: row.id, slug: row.slug, label: row.label, sortOrder: row.sort_order };
}

// taxonomy.repository.ts::mapPropertyTypeRow already flattens the joined
// property_type_categories row onto `category` server-side — this mapper
// only needs id/slug/label passthrough plus that same key.
function mapPropertyTypeRow(row: any): PropertyType {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    category: { slug: row.category?.slug, label: row.category?.label },
  };
}

function mapAmenityRow(row: any): Amenity {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    category: row.category,
    valueType: row.value_type,
    valueUnit: row.value_unit,
    options: row.options,
    propertyTypeCategories: (row.property_type_categories ?? []).map((c: any) => ({ slug: c.slug, label: c.label })),
  };
}

export interface TaxonomyPageFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedCategories {
  items: PropertyTypeCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedPropertyTypes {
  items: PropertyType[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedAmenities {
  items: Amenity[];
  total: number;
  page: number;
  pageSize: number;
}

export const taxonomyRepository = {
  // Dual-mode, mirroring the backend: called with no page/pageSize,
  // resolves to the bare array (every submission-form dropdown sitewide);
  // called with either, resolves to a Page shape (the Taxonomy admin
  // table). See taxonomy.repository.ts::listCategories's comment for why —
  // this is the highest-risk of the dual-mode endpoints, since the
  // unpaginated branch must never be capped.
  listCategories: async (filters: TaxonomyPageFilters = {}): Promise<PropertyTypeCategory[] | PaginatedCategories> => {
    const { data } = await httpClient.get('/taxonomy/property-type-categories', { params: filters });
    if (Array.isArray(data)) return (data as any[]).map(mapCategoryRow);
    return { ...data, items: (data.items as any[]).map(mapCategoryRow) };
  },

  listPropertyTypes: async (filters: TaxonomyPageFilters = {}): Promise<PropertyType[] | PaginatedPropertyTypes> => {
    const { data } = await httpClient.get('/taxonomy/property-types', { params: filters });
    if (Array.isArray(data)) return (data as any[]).map(mapPropertyTypeRow);
    return { ...data, items: (data.items as any[]).map(mapPropertyTypeRow) };
  },

  // propertyTypeCategorySlug lets a listing-submission form only fetch
  // amenities relevant to the property type being listed (e.g. Plots don't
  // get Drawing Room/Servant Quarters). Unlike listCategories/
  // listPropertyTypes, taxonomy.repository.ts::listAmenities already applies
  // its own mapAmenityRow server-side (camelCase), so the response — array
  // or Page — needs no further row-mapping here, just shape normalization.
  listAmenities: async (
    filters: TaxonomyPageFilters & { propertyTypeCategorySlug?: string } = {},
  ): Promise<Amenity[] | PaginatedAmenities> => {
    const { data } = await httpClient.get('/taxonomy/amenities', { params: filters });
    return data;
  },

  // Super Admin-only taxonomy CRUD.
  createCategory: async (input: CreatePropertyTypeCategoryInput): Promise<PropertyTypeCategory> => {
    const { data } = await httpClient.post('/taxonomy/property-type-categories', input);
    return mapCategoryRow(data);
  },

  updateCategory: async (id: string, input: UpdatePropertyTypeCategoryInput): Promise<PropertyTypeCategory> => {
    const { data } = await httpClient.patch(`/taxonomy/property-type-categories/${id}`, input);
    return mapCategoryRow(data);
  },

  removeCategory: async (id: string): Promise<void> => {
    await httpClient.delete(`/taxonomy/property-type-categories/${id}`);
  },

  createPropertyType: async (input: CreatePropertyTypeInput): Promise<PropertyType> => {
    const { data } = await httpClient.post('/taxonomy/property-types', input);
    return mapPropertyTypeRow(data);
  },

  updatePropertyType: async (id: string, input: UpdatePropertyTypeInput): Promise<PropertyType> => {
    const { data } = await httpClient.patch(`/taxonomy/property-types/${id}`, input);
    return mapPropertyTypeRow(data);
  },

  removePropertyType: async (id: string): Promise<void> => {
    await httpClient.delete(`/taxonomy/property-types/${id}`);
  },

  createAmenity: async (input: CreateAmenityInput): Promise<Amenity> => {
    const { data } = await httpClient.post('/taxonomy/amenities', input);
    return mapAmenityRow(data);
  },

  updateAmenity: async (id: string, input: UpdateAmenityInput): Promise<Amenity> => {
    const { data } = await httpClient.patch(`/taxonomy/amenities/${id}`, input);
    return mapAmenityRow(data);
  },

  removeAmenity: async (id: string): Promise<void> => {
    await httpClient.delete(`/taxonomy/amenities/${id}`);
  },
};
