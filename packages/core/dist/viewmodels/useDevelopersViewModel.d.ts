import { CreateDeveloperInput, UpdateDeveloperInput } from '../models';
export declare function useDevelopersViewModel(filters?: {
    city?: string;
}): {
    developers: NoInfer<import("..").Developer[]>;
    isLoading: boolean;
    create: import("@tanstack/react-query").UseMutationResult<import("..").Developer, Error, CreateDeveloperInput, unknown>;
    update: import("@tanstack/react-query").UseMutationResult<import("..").Developer, Error, {
        id: string;
        input: UpdateDeveloperInput;
    }, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<{
        id: string;
    }, Error, string, unknown>;
};
