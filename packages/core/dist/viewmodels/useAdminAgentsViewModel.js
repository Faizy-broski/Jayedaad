import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';
import { agentsRepository } from '../services/agentsRepository';
// Super Admin agent management — roster from GET /admin/agents (the only
// "list all agents" endpoint), row actions hit the per-agent endpoints
// (already unscoped for super_admin server-side).
export function useAdminAgentsViewModel() {
    const queryClient = useQueryClient();
    const queryKey = ['admin', 'agents-overview'];
    const query = useQuery({
        queryKey,
        queryFn: adminRepository.listAgentsOverview,
    });
    const invalidate = () => queryClient.invalidateQueries({ queryKey });
    const updateProfile = useMutation({
        mutationFn: ({ agentId, input }) => agentsRepository.updateProfile(agentId, input),
        onSuccess: invalidate,
    });
    const grantCredits = useMutation({
        mutationFn: ({ agentId, input }) => agentsRepository.grantCredits(agentId, input),
        onSuccess: invalidate,
    });
    const setVerificationStatus = useMutation({
        mutationFn: ({ agentId, status }) => agentsRepository.setVerificationStatus(agentId, status),
        onSuccess: invalidate,
    });
    return {
        agents: query.data ?? [],
        isLoading: query.isLoading,
        updateProfile,
        grantCredits,
        setVerificationStatus,
    };
}
