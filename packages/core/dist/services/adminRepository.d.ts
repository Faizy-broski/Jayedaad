import { AgentOverview, PlatformStats, RoleAccessDescription } from '../models';
export declare const adminRepository: {
    getPlatformStats: () => Promise<PlatformStats>;
    listAgentsOverview: () => Promise<AgentOverview[]>;
    listRoles: () => Promise<RoleAccessDescription[]>;
};
