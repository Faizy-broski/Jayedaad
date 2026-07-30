import { UpdateAgentProfileInput } from '../services/agentsRepository';
import { GrantAgentCreditsInput } from '../models';
export declare function useAdminAgentsViewModel(): {
    agents: NoInfer<import("..").AgentOverview[]>;
    isLoading: boolean;
    updateProfile: import("@tanstack/react-query").UseMutationResult<import("..").AgentProfileSummary, Error, {
        agentId: string;
        input: UpdateAgentProfileInput;
    }, unknown>;
    grantCredits: import("@tanstack/react-query").UseMutationResult<import("..").AgentCredit, Error, {
        agentId: string;
        input: GrantAgentCreditsInput;
    }, unknown>;
    setVerificationStatus: import("@tanstack/react-query").UseMutationResult<import("..").AgentProfileSummary, Error, {
        agentId: string;
        status: "verified" | "rejected";
    }, unknown>;
};
