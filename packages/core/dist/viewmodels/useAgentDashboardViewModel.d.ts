import { AgentAnalyticsFilters } from '../services/agentsRepository';
export declare function useAgentDashboardViewModel(analyticsFilters?: AgentAnalyticsFilters): {
    stats: NoInfer<import("..").AgentStats> | undefined;
    isStatsLoading: boolean;
    credits: NoInfer<import("..").AgentCredit[]>;
    isCreditsLoading: boolean;
    analytics: NoInfer<import("..").AgentAnalytics> | undefined;
    isAnalyticsLoading: boolean;
    recentListings: import("..").Listing[];
    isRecentListingsLoading: boolean;
};
