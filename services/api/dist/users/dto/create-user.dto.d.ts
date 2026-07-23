declare const ROLES: readonly ["super_admin", "verification_staff", "agent", "buyer", "owner"];
export declare class CreateUserDto {
    email: string;
    password: string;
    role: (typeof ROLES)[number];
    displayName?: string;
    agencyId?: string;
}
export {};
