import { useQuery } from '@tanstack/react-query';
import { AdminPageFilters, adminRepository, AdminPaginatedAgencies } from '../services/adminRepository';
import { Agency } from '../models';

function normalizeAgenciesResult(
  data: Agency[] | AdminPaginatedAgencies | undefined,
  filters: AdminPageFilters,
): AdminPaginatedAgencies {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Read-only, unpaginated-by-default roster mirroring useAdminAgentsViewModel's
// shape — CRM's agent/agency picker needs the full agency list the same way
// it already needs the full agent list. Mutations for agency management
// already live in useAgencyManagementViewModel; this hook is purely the
// "give me every agency" read side for a second consumer (the picker) that
// doesn't want that hook's pagination-by-default/CRUD surface.
export function useAdminAgenciesViewModel(filters: AdminPageFilters & { search?: string } = {}) {
  const query = useQuery({
    queryKey: ['admin', 'agencies-overview', filters],
    queryFn: () => adminRepository.listAgenciesOverview(filters),
  });

  const result = normalizeAgenciesResult(query.data, filters);

  return {
    agencies: result.items,
    total: result.total,
    isLoading: query.isLoading,
  };
}
