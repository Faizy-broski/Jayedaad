import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersRepository } from '../services/usersRepository';
// Super Admin user/role management — full account lifecycle.
export function useUserManagementViewModel(filters = {}) {
    const queryClient = useQueryClient();
    const queryKey = ['admin', 'users', filters];
    const query = useQuery({
        queryKey,
        queryFn: () => usersRepository.list(filters),
    });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    const create = useMutation({
        mutationFn: (input) => usersRepository.create(input),
        onSuccess: invalidate,
    });
    const updateRole = useMutation({
        mutationFn: ({ id, input }) => usersRepository.updateRole(id, input),
        onSuccess: invalidate,
    });
    const suspend = useMutation({
        mutationFn: (id) => usersRepository.suspend(id),
        onSuccess: invalidate,
    });
    const unsuspend = useMutation({
        mutationFn: (id) => usersRepository.unsuspend(id),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id) => usersRepository.remove(id),
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
