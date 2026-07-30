import { AdminUser, CreateUserInput, ListUsersFilters, UpdateUserRoleInput } from '../models';
export declare const usersRepository: {
    list: (filters?: ListUsersFilters) => Promise<AdminUser[]>;
    findById: (id: string) => Promise<AdminUser>;
    create: (input: CreateUserInput) => Promise<AdminUser>;
    updateRole: (id: string, input: UpdateUserRoleInput) => Promise<void>;
    suspend: (id: string) => Promise<void>;
    unsuspend: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
};
