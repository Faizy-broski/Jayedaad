import { CreateSavedSearchInput } from '../services/savedSearchesRepository';
export declare function useSavedSearchesViewModel(): {
    savedSearches: NoInfer<import("..").SavedSearch[]>;
    isLoading: boolean;
    create: import("@tanstack/react-query").UseMutationResult<import("..").SavedSearch, Error, CreateSavedSearchInput, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
};
