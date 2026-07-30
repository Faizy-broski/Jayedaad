export declare function useAdminDashboardViewModel(): {
    stats: NoInfer<import("..").PlatformStats> | undefined;
    isStatsLoading: boolean;
    agents: NoInfer<import("..").AgentOverview[]>;
    isAgentsLoading: boolean;
};
