import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersRepository } from '../services/usersRepository';
import { CreateUserInput, ListUsersFilters, UpdateUserRoleInput } from '../models';

// Super Admin user/role management — full account lifecycle.
export function useUserManagementViewModel(filters: ListUsersFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'users', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => usersRepository.list(filters),
  });

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
    users: query.data ?? [],
    isLoading: query.isLoading,
    create,
    updateRole,
    suspend,
    unsuspend,
    remove,
  };
}
