export declare function useFavoritesViewModel(): {
    favorites: NoInfer<import("..").Favorite[]>;
    isLoading: boolean;
    add: import("@tanstack/react-query").UseMutationResult<import("..").Favorite, Error, string, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
};
