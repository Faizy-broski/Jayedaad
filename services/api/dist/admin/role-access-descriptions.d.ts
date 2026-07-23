import { Role } from '../common/types';
export interface RoleAccessDescription {
    role: Role;
    label: string;
    description: string;
    capabilities: string[];
}
export declare const ROLE_ACCESS_DESCRIPTIONS: Record<Role, RoleAccessDescription>;
