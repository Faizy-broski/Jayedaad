import { CreateUserInput, ListUsersFilters, UpdateUserRoleInput } from '../models';
export declare function useUserManagementViewModel(filters?: ListUsersFilters): {
    users: NoInfer<import("..").AdminUser[]>;
    isLoading: boolean;
    create: import("@tanstack/react-query").UseMutationResult<import("..").AdminUser, Error, CreateUserInput, unknown>;
    updateRole: import("@tanstack/react-query").UseMutationResult<void, Error, {
        id: string;
        input: UpdateUserRoleInput;
    }, unknown>;
    suspend: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
    unsuspend: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
};
