import { AssignSubscriptionInput } from '../models';
export declare function useSubscriptionViewModel(): {
    current: NoInfer<import("..").Subscription | null> | undefined;
    isCurrentLoading: boolean;
    tiers: NoInfer<import("..").SubscriptionTier[]>;
    isTiersLoading: boolean;
    usage: NoInfer<import("..").SubscriptionUsage> | undefined;
    selectTier: import("@tanstack/react-query").UseMutationResult<import("..").Subscription, Error, AssignSubscriptionInput, unknown>;
};
