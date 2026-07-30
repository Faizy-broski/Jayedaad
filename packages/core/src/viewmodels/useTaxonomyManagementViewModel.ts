import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taxonomyRepository } from '../services/taxonomyRepository';
import {
  CreateAmenityInput,
  CreatePropertyTypeCategoryInput,
  CreatePropertyTypeInput,
  UpdateAmenityInput,
  UpdatePropertyTypeCategoryInput,
  UpdatePropertyTypeInput,
} from '../models';

// Super Admin taxonomy management — full CRUD on property-type categories,
// property types, and amenities (the read-only useTaxonomyViewModel is for
// every other consumer; this is the write side).
export function useTaxonomyManagementViewModel() {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: taxonomyRepository.listCategories });
  const typesQuery = useQuery({ queryKey: ['taxonomy', 'property-types'], queryFn: () => taxonomyRepository.listPropertyTypes() });
  const amenitiesQuery = useQuery({ queryKey: ['taxonomy', 'amenities'], queryFn: () => taxonomyRepository.listAmenities() });

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
    categories: categoriesQuery.data ?? [],
    propertyTypes: typesQuery.data ?? [],
    amenities: amenitiesQuery.data ?? [],
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
