import { UserPreferences } from '../models';
export declare function usePreferencesViewModel(): {
    preferences: NoInfer<UserPreferences> | undefined;
    isLoading: boolean;
    updatePreferences: import("@tanstack/react-query").UseMutationResult<UserPreferences, Error, Partial<UserPreferences>, unknown>;
};
