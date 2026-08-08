import { useQuery } from '@tanstack/react-query';
import { taxonomyRepository } from '../services/taxonomyRepository';

// Property types/amenities are Super Admin-managed [Reqs §9], not hardcoded
// in the frontend — this is what makes the taxonomy API load-bearing rather
// than an unused endpoint. Long staleTime since this data changes rarely.
// propertyTypeCategorySlug (e.g. from a listing-submission form once the
// submitter has picked a property type) scopes amenities to ones relevant
// to that category — a Plot submission shouldn't be offered Drawing Room.
export function useTaxonomyViewModel(propertyTypeCategorySlug?: string) {
  const propertyTypes = useQuery({
    queryKey: ['taxonomy', 'property-types'],
    // Called with no filters -> the unpaginated array branch of the
    // dual-mode endpoint (see taxonomy.repository.ts::listPropertyTypes).
    queryFn: () => taxonomyRepository.listPropertyTypes(),
    select: (data) => (Array.isArray(data) ? data : data.items),
    staleTime: 5 * 60_000,
  });

  const amenities = useQuery({
    queryKey: ['taxonomy', 'amenities', propertyTypeCategorySlug ?? null],
    queryFn: () => taxonomyRepository.listAmenities({ propertyTypeCategorySlug }),
    select: (data) => (Array.isArray(data) ? data : data.items),
    staleTime: 5 * 60_000,
  });

  return {
    propertyTypes: propertyTypes.data ?? [],
    amenities: amenities.data ?? [],
    isLoading: propertyTypes.isLoading || amenities.isLoading,
  };
}
