import { useMemo } from 'react';
import { useAdminAgentsViewModel } from './useAdminAgentsViewModel';
import { useAdminAgenciesViewModel } from './useAdminAgenciesViewModel';
import { Agency, AgentOverview } from '../models';

export interface AgencyGroup {
  agency: Agency;
  agents: AgentOverview[];
}

// Drives Super Admin CRM's agent/agency picker — composes the two existing
// unbounded rosters (useAdminAgentsViewModel/useAdminAgenciesViewModel)
// rather than a new merged backend endpoint (both are already small,
// admin-only, cached lists; grouping+filtering them client-side is cheap
// and doesn't fork a second roster shape for the same underlying rows).
// Splits agents into "belongs to an agency" (grouped under that agency,
// regardless of isAgencyAdmin) vs. "independent" (agency === null) — the
// literal "differentiate agencies from independent agents" ask.
export function useAgentAgencyPickerViewModel(searchTerm: string) {
  const { agents, isLoading: agentsLoading } = useAdminAgentsViewModel();
  const { agencies, isLoading: agenciesLoading } = useAdminAgenciesViewModel();

  const term = searchTerm.trim().toLowerCase();

  const { agencyGroups, independentAgentOptions } = useMemo(() => {
    const agentsByAgencyId = new Map<string, AgentOverview[]>();
    const independent: AgentOverview[] = [];
    for (const agent of agents) {
      if (agent.agency) {
        const list = agentsByAgencyId.get(agent.agency.id) ?? [];
        list.push(agent);
        agentsByAgencyId.set(agent.agency.id, list);
      } else {
        independent.push(agent);
      }
    }

    const matchesAgent = (a: AgentOverview) =>
      !term || (a.displayName ?? '').toLowerCase().includes(term) || (a.email ?? '').toLowerCase().includes(term) || (a.city ?? '').toLowerCase().includes(term);
    const matchesAgency = (a: Agency) => !term || a.name.toLowerCase().includes(term) || (a.city ?? '').toLowerCase().includes(term);

    const groups: AgencyGroup[] = agencies
      .filter((agency) => matchesAgency(agency) || (agentsByAgencyId.get(agency.id) ?? []).some(matchesAgent))
      .map((agency) => ({
        agency,
        agents: (agentsByAgencyId.get(agency.id) ?? []).filter((a) => matchesAgency(agency) || matchesAgent(a)),
      }));

    return {
      agencyGroups: groups,
      independentAgentOptions: independent.filter(matchesAgent),
    };
  }, [agents, agencies, term]);

  return {
    agencyGroups,
    independentAgentOptions,
    isLoading: agentsLoading || agenciesLoading,
  };
}
