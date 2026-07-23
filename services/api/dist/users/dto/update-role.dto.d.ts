declare const ROLES: readonly ["super_admin", "verification_staff", "agent", "buyer", "owner"];
export declare class UpdateUserRoleDto {
    role: (typeof ROLES)[number];
}
export {};
