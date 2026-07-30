import { CreateListingInput, MyListingsFilters } from '../services/listingsRepository';
export declare function useMyListingsViewModel(filters: MyListingsFilters): {
    listings: import("..").Listing[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    statusCounts: NoInfer<Record<string, number>>;
    isStatusCountsLoading: boolean;
    update: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, {
        listingId: string;
        input: Partial<CreateListingInput>;
    }, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, string, unknown>;
    submitForVerification: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, string, unknown>;
};
