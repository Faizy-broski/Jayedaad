export declare function useSavedSearchesViewModel(): {
    savedSearches: NoInfer<import("..").SavedSearch[]>;
    isLoading: boolean;
    remove: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
};
