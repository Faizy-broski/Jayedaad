import { httpClient } from './httpClient';
import {
  AgentAnalytics,
  AgentDailyAnalyticsPoint,
  AgentCredit,
  AgentProfileSummary,
  AgentStats,
  ApplyAsAgentInput,
  GrantAgentCreditsInput,
  ListingPurpose,
  OnboardingDocument,
  OnboardingDocumentType,
  PendingAgentApplication,
} from '../models';

export interface AgentAnalyticsFilters {
  purpose?: ListingPurpose;
  since?: string;
}

// Mirrors services/api/src/agents/dto/update-profile.dto.ts — Email is
// deliberately absent, the account's login email is never editable here.
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

// Backs the Profolio-style agent Dashboard (stats/credits/analytics cards)
// and the "User Settings" tab of the Settings page.
// Mirrors services/api/src/agents/agents.controller.ts's endpoints — see
// packages/core/src/models/index.ts for the exact response shapes.
export const agentsRepository = {
  getStats: async (agentId: string): Promise<AgentStats> => {
    const { data } = await httpClient.get(`/agents/${agentId}/stats`);
    return data;
  },

  getCredits: async (agentId: string): Promise<AgentCredit[]> => {
    const { data } = await httpClient.get(`/agents/${agentId}/credits`);
    return data;
  },

  getAnalytics: async (agentId: string, filters: AgentAnalyticsFilters = {}): Promise<AgentAnalytics> => {
    const { data } = await httpClient.get(`/agents/${agentId}/analytics`, { params: filters });
    return data;
  },

  getDailyAnalytics: async (agentId: string, days = 7): Promise<AgentDailyAnalyticsPoint[]> => {
    const { data } = await httpClient.get(`/agents/${agentId}/analytics/daily`, { params: { days } });
    return data;
  },

  getProfile: async (agentId: string): Promise<AgentProfileSummary> => {
    const { data } = await httpClient.get(`/agents/${agentId}`);
    return data;
  },

  updateProfile: async (agentId: string, input: UpdateAgentProfileInput): Promise<AgentProfileSummary> => {
    const { data } = await httpClient.patch(`/agents/${agentId}`, input);
    return data;
  },

  // `file` is platform-specific (a browser File on web, a { uri, name, type }
  // asset object on React Native) — same untyped convention as
  // listingsRepository.uploadDocument/uploadListingMedia.
  uploadPhoto: async (agentId: string, file: any): Promise<AgentProfileSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post(`/agents/${agentId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Uploads before the entity that will reference it exists — used by the
  // Agency Staff "Add Agent" flow, where there's no agent id yet until
  // agenciesRepository.addStaff() runs. Returns a plain public url, attached
  // via CreateAgencyStaffInput.photoUrl on that subsequent call. Same
  // untyped `file` convention as uploadPhoto/uploadDocument above.
  uploadStandaloneAvatar: async (file: any): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post('/agents/photo/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Super Admin-only — the write-side counterpart to getCredits above.
  grantCredits: async (agentId: string, input: GrantAgentCreditsInput): Promise<AgentCredit> => {
    const { data } = await httpClient.patch(`/agents/${agentId}/credits`, input);
    return data;
  },

  setVerificationStatus: async (agentId: string, status: 'verified' | 'rejected', reason?: string): Promise<AgentProfileSummary> => {
    const { data } = await httpClient.patch(`/agents/${agentId}/verify`, { status, reason });
    return data;
  },

  // Self-service "Apply to become an agent" — buyer-only server-side.
  applyAsAgent: async (input: ApplyAsAgentInput): Promise<AgentProfileSummary> => {
    const { data } = await httpClient.post('/agents/apply', input);
    return data;
  },

  // Staff review queue — super_admin/verification_staff only server-side.
  listPendingVerification: async (): Promise<PendingAgentApplication[]> => {
    const { data } = await httpClient.get('/agents/pending-verification');
    return data;
  },

  // Onboarding documents — same required set as agencies (an independent
  // agent stands in as their own "company"). `file` is platform-specific,
  // same untyped convention as listingsRepository.uploadDocument.
  uploadDocument: async (agentId: string, documentType: OnboardingDocumentType, file: any): Promise<OnboardingDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post(`/agents/${agentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listDocuments: async (agentId: string): Promise<OnboardingDocument[]> => {
    const { data } = await httpClient.get(`/agents/${agentId}/documents`);
    return data;
  },
};
