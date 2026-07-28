import { VerificationAction } from '../services/verificationRepository';
export declare function useVerificationQueueViewModel(): {
    queue: NoInfer<import("..").Listing[]>;
    isLoading: boolean;
    act: import("@tanstack/react-query").UseMutationResult<any, Error, {
        listingId: string;
        action: VerificationAction;
        note?: string;
    }, unknown>;
};
