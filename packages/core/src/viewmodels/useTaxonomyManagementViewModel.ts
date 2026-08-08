import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taxonomyRepository } from '../services/taxonomyRepository';
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

interface PageFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function normalize<T>(data: T[] | PageResult<T> | undefined, filters: PageFilters): PageResult<T> {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Super Admin taxonomy management — full CRUD on property-type categories,
// property types, and amenities (the read-only useTaxonomyViewModel is for
// every other consumer; this is the write side). Each of the three
// sub-lists is independently paged/searched — pass page/pageSize/search per
// sub-list the admin page is currently viewing; omit all three to get the
// full unpaginated set (matches useTaxonomyViewModel's usage elsewhere).
export function useTaxonomyManagementViewModel(
  filters: { categories?: PageFilters; propertyTypes?: PageFilters; amenities?: PageFilters } = {},
) {
  const queryClient = useQueryClient();
  const categoryFilters = filters.categories ?? {};
  const typeFilters = filters.propertyTypes ?? {};
  const amenityFilters = filters.amenities ?? {};

  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories', categoryFilters],
    queryFn: () => taxonomyRepository.listCategories(categoryFilters),
  });
  const typesQuery = useQuery({
    queryKey: ['taxonomy', 'property-types', typeFilters],
    queryFn: () => taxonomyRepository.listPropertyTypes(typeFilters),
  });
  const amenitiesQuery = useQuery({
    queryKey: ['taxonomy', 'amenities', amenityFilters],
    queryFn: () => taxonomyRepository.listAmenities(amenityFilters),
  });

  const categories = normalize<PropertyTypeCategory>(categoriesQuery.data, categoryFilters);
  const propertyTypes = normalize<PropertyType>(typesQuery.data, typeFilters);
  const amenities = normalize<Amenity>(amenitiesQuery.data, amenityFilters);

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] });

  const createCategory = useMutation({
    mutationFn: (input: CreatePropertyTypeCategoryInput) => taxonomyRepository.createCategory(input),
    onSuccess: invalidateAll,
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyTypeCategoryInput }) => taxonomyRepository.updateCategory(id, input),
    onSuccess: invalidateAll,
  });
  const removeCategory = useMutation({
    mutationFn: (id: string) => taxonomyRepository.removeCategory(id),
    onSuccess: invalidateAll,
  });

  const createPropertyType = useMutation({
    mutationFn: (input: CreatePropertyTypeInput) => taxonomyRepository.createPropertyType(input),
    onSuccess: invalidateAll,
  });
  const updatePropertyType = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyTypeInput }) => taxonomyRepository.updatePropertyType(id, input),
    onSuccess: invalidateAll,
  });
  const removePropertyType = useMutation({
    mutationFn: (id: string) => taxonomyRepository.removePropertyType(id),
    onSuccess: invalidateAll,
  });

  const createAmenity = useMutation({
    mutationFn: (input: CreateAmenityInput) => taxonomyRepository.createAmenity(input),
    onSuccess: invalidateAll,
  });
  const updateAmenity = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAmenityInput }) => taxonomyRepository.updateAmenity(id, input),
    onSuccess: invalidateAll,
  });
  const removeAmenity = useMutation({
    mutationFn: (id: string) => taxonomyRepository.removeAmenity(id),
    onSuccess: invalidateAll,
  });

  return {
    categories: categories.items,
    categoriesTotal: categories.total,
    propertyTypes: propertyTypes.items,
    propertyTypesTotal: propertyTypes.total,
    amenities: amenities.items,
    amenitiesTotal: amenities.total,
    isLoading: categoriesQuery.isLoading || typesQuery.isLoading || amenitiesQuery.isLoading,
    createCategory,
    updateCategory,
    removeCategory,
    createPropertyType,
    updatePropertyType,
    removePropertyType,
    createAmenity,
    updateAmenity,
    removeAmenity,
  };
}
