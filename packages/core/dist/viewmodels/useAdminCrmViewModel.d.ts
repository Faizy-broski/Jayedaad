import { LeadListFilters } from '../services/leadsRepository';
import { Lead, LeadStatus } from '../models';
export declare function useAdminCrmViewModel(filters: LeadListFilters): {
    leads: NoInfer<Lead[]>;
    isLoading: boolean;
    updateStatus: import("@tanstack/react-query").UseMutationResult<any, Error, {
        leadId: string;
        status: LeadStatus;
    }, {
        previous: Lead[] | undefined;
    }>;
    addNote: import("@tanstack/react-query").UseMutationResult<any, Error, {
        leadId: string;
        body: string;
    }, unknown>;
    assign: import("@tanstack/react-query").UseMutationResult<void, Error, {
        leadId: string;
        agentId: string;
    }, unknown>;
};
