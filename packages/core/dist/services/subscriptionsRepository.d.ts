import { AssignSubscriptionInput, CreateSubscriptionTierInput, Subscription, SubscriptionTier, SubscriptionUsage, UpdateSubscriptionTierInput } from '../models';
export declare const subscriptionsRepository: {
    listTiers: () => Promise<SubscriptionTier[]>;
    getUsage: () => Promise<SubscriptionUsage>;
    getMine: () => Promise<Subscription | null>;
    selectTier: (input: AssignSubscriptionInput) => Promise<Subscription>;
    assignToAgent: (agentId: string, input: AssignSubscriptionInput) => Promise<Subscription>;
    createTier: (input: CreateSubscriptionTierInput) => Promise<SubscriptionTier>;
    updateTier: (id: string, input: UpdateSubscriptionTierInput) => Promise<SubscriptionTier>;
    removeTier: (id: string) => Promise<void>;
};
