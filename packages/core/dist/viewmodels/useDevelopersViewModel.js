import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { developersRepository } from '../services/developersRepository';
// Super Admin developer-company management — full CRUD.
export function useDevelopersViewModel(filters = {}) {
    const queryClient = useQueryClient();
    const queryKey = ['admin', 'developers', filters];
    const query = useQuery({
        queryKey,
        queryFn: () => developersRepository.list(filters),
    });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'developers'] });
    const create = useMutation({
        mutationFn: (input) => developersRepository.create(input),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, input }) => developersRepository.update(id, input),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id) => developersRepository.remove(id),
        onSuccess: invalidate,
    });
    return {
        developers: query.data ?? [],
        isLoading: query.isLoading,
        create,
        update,
        remove,
    };
}
