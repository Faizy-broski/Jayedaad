import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersRepository } from '../services/usersRepository';
import { AdminUser, CreateUserInput, ListUsersFilters, ListUsersResult, UpdateUserRoleInput } from '../models';

function normalizeUsersResult(data: AdminUser[] | ListUsersResult | undefined, filters: ListUsersFilters): ListUsersResult {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Super Admin user/role management — full account lifecycle. Dual-mode:
// called with no filters (Verification Log's reviewer-name lookup), the
// endpoint returns every user unpaginated; called with page/pageSize (the
// Users admin table), it paginates. Either way this hook always returns the
// same { users, total, page, pageSize } shape so callers don't need to
// branch.
export function useUserManagementViewModel(filters: ListUsersFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'users', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => usersRepository.list(filters),
  });

  const result = normalizeUsersResult(query.data, filters);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const create = useMutation({
    mutationFn: (input: CreateUserInput) => usersRepository.create(input),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserRoleInput }) => usersRepository.updateRole(id, input),
    onSuccess: invalidate,
  });

  const suspend = useMutation({
    mutationFn: (id: string) => usersRepository.suspend(id),
    onSuccess: invalidate,
  });

  const unsuspend = useMutation({
    mutationFn: (id: string) => usersRepository.unsuspend(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    users: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    isLoading: query.isLoading,
    create,
    updateRole,
    suspend,
    unsuspend,
    remove,
  };
}
