import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminAgentsFilters, adminRepository, PaginatedAgentsOverview } from '../services/adminRepository';
import { agentsRepository, UpdateAgentProfileInput } from '../services/agentsRepository';
import { AgentOverview, GrantAgentCreditsInput } from '../models';

function normalizeAgentsResult(
  data: AgentOverview[] | PaginatedAgentsOverview | undefined,
  filters: AdminAgentsFilters,
): PaginatedAgentsOverview {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Super Admin agent management — roster from GET /admin/agents (the only
// "list all agents" endpoint), row actions hit the per-agent endpoints
// (already unscoped for super_admin server-side). Dual-mode: called with no
// filters (CRM's dropdowns), the endpoint returns every agent unpaginated;
// called with page/pageSize (the Agents admin table), it paginates. Either
// way this hook always returns the same { agents, total, page, pageSize }
// shape so callers don't need to branch.
export function useAdminAgentsViewModel(filters: AdminAgentsFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agents-overview', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => adminRepository.listAgentsOverview(filters),
  });

  const result = normalizeAgentsResult(query.data, filters);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'agents-overview'] });

  const updateProfile = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: UpdateAgentProfileInput }) =>
      agentsRepository.updateProfile(agentId, input),
    onSuccess: invalidate,
  });

  const grantCredits = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: GrantAgentCreditsInput }) =>
      agentsRepository.grantCredits(agentId, input),
    onSuccess: invalidate,
  });

  const setVerificationStatus = useMutation({
    mutationFn: ({ agentId, status, reason }: { agentId: string; status: 'verified' | 'rejected'; reason?: string }) =>
      agentsRepository.setVerificationStatus(agentId, status, reason),
    onSuccess: invalidate,
  });

  return {
    agents: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    isLoading: query.isLoading,
    updateProfile,
    grantCredits,
    setVerificationStatus,
  };
}
