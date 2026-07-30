import { MyListingsFilters } from '../services/listingsRepository';
import { ListingStatus } from '../models';
export declare function useAdminListingsViewModel(filters: MyListingsFilters): {
    listings: import("..").Listing[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    statusCounts: NoInfer<Record<string, number>>;
    setStatus: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, {
        listingId: string;
        status: ListingStatus;
    }, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, string, unknown>;
};
export declare function useAdminListingDetailViewModel(listingId: string): {
    listing: NoInfer<import("..").Listing> | undefined;
    isLoading: boolean;
    setStatus: import("@tanstack/react-query").UseMutationResult<import("..").Listing, Error, {
        status: ListingStatus;
    }, unknown>;
};
