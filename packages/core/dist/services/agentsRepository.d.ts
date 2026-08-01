import { AgentAnalytics, AgentCredit, AgentProfileSummary, AgentStats, ApplyAsAgentInput, GrantAgentCreditsInput, ListingPurpose, OnboardingDocument, OnboardingDocumentType, PendingAgentApplication } from '../models';
export interface AgentAnalyticsFilters {
    purpose?: ListingPurpose;
    since?: string;
}
export interface UpdateAgentProfileInput {
    displayName?: string;
    phone?: string;
    whatsapp?: string;
    landline?: string;
    city?: string;
    address?: string;
    bio?: string;
    photoUrl?: string;
}
export declare const agentsRepository: {
    getStats: (agentId: string) => Promise<AgentStats>;
    getCredits: (agentId: string) => Promise<AgentCredit[]>;
    getAnalytics: (agentId: string, filters?: AgentAnalyticsFilters) => Promise<AgentAnalytics>;
    getProfile: (agentId: string) => Promise<AgentProfileSummary>;
    updateProfile: (agentId: string, input: UpdateAgentProfileInput) => Promise<AgentProfileSummary>;
    uploadPhoto: (agentId: string, file: any) => Promise<AgentProfileSummary>;
    grantCredits: (agentId: string, input: GrantAgentCreditsInput) => Promise<AgentCredit>;
    setVerificationStatus: (agentId: string, status: "verified" | "rejected") => Promise<AgentProfileSummary>;
    applyAsAgent: (input: ApplyAsAgentInput) => Promise<AgentProfileSummary>;
    listPendingVerification: () => Promise<PendingAgentApplication[]>;
    uploadDocument: (agentId: string, documentType: OnboardingDocumentType, file: any) => Promise<OnboardingDocument>;
    listDocuments: (agentId: string) => Promise<OnboardingDocument[]>;
};
