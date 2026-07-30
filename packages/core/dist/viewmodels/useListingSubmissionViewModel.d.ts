import { CreateListingInput } from '../services/listingsRepository';
export declare function useListingSubmissionViewModel(): {
    submit: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, CreateListingInput, unknown>;
    saveDraft: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, CreateListingInput, unknown>;
    submitForVerification: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, string, unknown>;
    update: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, {
        listingId: string;
        input: Partial<CreateListingInput>;
    }, unknown>;
};
