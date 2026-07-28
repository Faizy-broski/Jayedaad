import { ListingSearchFilters } from '../services/listingsRepository';
export declare function useListingSearchViewModel(filters: ListingSearchFilters): {
    listings: import("..").Listing[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    error: Error | null;
};
