import { UpdateAgentProfileInput } from '../services/agentsRepository';
export declare function useAgentProfileViewModel(): {
    profile: NoInfer<import("..").AgentProfileSummary> | undefined;
    isLoading: boolean;
    updateProfile: import("@tanstack/react-query").UseMutationResult<import("..").AgentProfileSummary, Error, UpdateAgentProfileInput, unknown>;
    uploadPhoto: import("@tanstack/react-query").UseMutationResult<import("..").AgentProfileSummary, Error, any, unknown>;
};
