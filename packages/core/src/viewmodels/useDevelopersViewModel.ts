import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { developersRepository, ListDevelopersFilters, PaginatedDevelopers } from '../services/developersRepository';
import { CreateDeveloperInput, Developer, UpdateDeveloperInput } from '../models';

function normalizeDevelopersResult(
  data: Developer[] | PaginatedDevelopers | undefined,
  filters: ListDevelopersFilters,
): PaginatedDevelopers {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Super Admin developer-company management — full CRUD. Dual-mode: called
// with no page/pageSize (ProjectForm's/ProjectsFilters'/PropertySearchBar's
// developer dropdowns), the endpoint returns every developer unpaginated;
// called with page/pageSize (the Developers admin table), it paginates.
// Either way this hook always returns the same
// { developers, total, page, pageSize } shape so callers don't need to
// branch.
export function useDevelopersViewModel(filters: ListDevelopersFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'developers', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => developersRepository.list(filters),
  });

  const result = normalizeDevelopersResult(query.data, filters);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'developers'] });

  const create = useMutation({
    mutationFn: (input: CreateDeveloperInput) => developersRepository.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeveloperInput }) => developersRepository.update(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => developersRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    developers: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
