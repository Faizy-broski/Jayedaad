import { AssignSubscriptionInput, CreateSubscriptionTierInput, UpdateSubscriptionTierInput } from '../models';
export declare function usePlanManagementViewModel(): {
    tiers: NoInfer<import("..").SubscriptionTier[]>;
    isLoading: boolean;
    createTier: import("@tanstack/react-query").UseMutationResult<import("..").SubscriptionTier, Error, CreateSubscriptionTierInput, unknown>;
    updateTier: import("@tanstack/react-query").UseMutationResult<import("..").SubscriptionTier, Error, {
        id: string;
        input: UpdateSubscriptionTierInput;
    }, unknown>;
    removeTier: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
    assignToAgent: import("@tanstack/react-query").UseMutationResult<import("..").Subscription, Error, {
        agentId: string;
        input: AssignSubscriptionInput;
    }, unknown>;
};
