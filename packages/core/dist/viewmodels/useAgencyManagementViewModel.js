import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
// Super Admin agency management — full CRUD + verification decision.
export function useAgencyManagementViewModel(filters = {}) {
    const queryClient = useQueryClient();
    const queryKey = ['admin', 'agencies', filters];
    const query = useQuery({
        queryKey,
        queryFn: () => agenciesRepository.list(filters),
    });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    const create = useMutation({
        mutationFn: (input) => agenciesRepository.create(input),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, input }) => agenciesRepository.update(id, input),
        onSuccess: invalidate,
    });
    const setVerificationStatus = useMutation({
        mutationFn: ({ id, input }) => agenciesRepository.setVerificationStatus(id, input),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id) => agenciesRepository.remove(id),
        onSuccess: invalidate,
    });
    return {
        agencies: query.data ?? [],
        isLoading: query.isLoading,
        create,
        update,
        setVerificationStatus,
        remove,
    };
}
