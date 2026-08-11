import { httpClient } from './httpClient';
import {
  Agency,
  AgencyCityCount,
  AgencyDetail,
  AgencySearchFilters,
  AgencyStaffAnalytics,
  AgencyStaffMember,
  AgencyStaffPreview,
  AgencyStats,
  AgencyWithStats,
  CreateAgencyInput,
  CreateAgencyStaffInput,
  OnboardingDocument,
  OnboardingDocumentType,
  PaginatedAgencies,
  RegisterAgencyInput,
  SetAgencyTierInput,
  SetAgencyVerificationStatusInput,
  UpdateAgencyInput,
} from '../models';

// services/api/src/agencies/agencies.repository.ts returns raw snake_case
// rows (no server-side mapper, unlike agents.repository.ts/listings.repository.ts)
// — mapped here to match Agency's camelCase shape. Exported so
// adminRepository.listAgenciesOverview (GET /admin/agencies, same raw-row
// shape) can reuse it instead of duplicating the mapping.
export function mapAgencyRow(row: any): Agency {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    phone: row.phone,
    email: row.email,
    city: row.city,
    address: row.address,
    businessHours: row.business_hours,
    verificationStatus: row.verification_status,
    rejectionReason: row.rejection_reason ?? null,
    salesAssociateCount: row.sales_associate_count,
    tier: row.tier,
  };
}

// searchPublic's rows carry forSaleCount/forRentCount already computed
// server-side (agencies.repository.ts::getStatsForAgencies) and merged onto
// the raw snake_case row — those two keys are already camelCase there, only
// the rest needs mapAgencyRow's snake->camel treatment.
function mapAgencyStatsRow(row: any): AgencyWithStats {
  return { ...mapAgencyRow(row), forSaleCount: row.forSaleCount ?? 0, forRentCount: row.forRentCount ?? 0 };
}

function mapAgencyStaffRow(row: any): AgencyStaffPreview {
  return {
    id: row.id,
    displayName: row.display_name,
    title: row.title,
    photoUrl: row.photo_url,
    phone: row.phone,
    whatsapp: row.whatsapp,
  };
}

// findBySlug's raw response embeds agent_profiles alongside the flat agency
// columns (services/api/src/agencies/agencies.repository.ts::findBySlug) —
// mapAgencyRow alone would silently drop it, same gap useMyAgencyViewModel's
// caller never needed until the Agency detail page did.
function mapAgencyDetailRow(row: any): AgencyDetail {
  return { ...mapAgencyRow(row), staff: (row.agent_profiles ?? []).map(mapAgencyStaffRow) };
}

export const agenciesRepository = {
  list: async (filters: { city?: string } = {}): Promise<Agency[]> => {
    const { data } = await httpClient.get('/agencies', { params: filters });
    return (data as any[]).map(mapAgencyRow);
  },

  // Public Agents directory (apps/web /agents) — Titanium/Featured tier
  // strips plus the searchable, paginated grid.
  searchPublic: async (filters: AgencySearchFilters = {}): Promise<PaginatedAgencies> => {
    const { data } = await httpClient.get('/agencies/search', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapAgencyStatsRow) };
  },

  // Backs "Browse Agencies By City".
  listCities: async (): Promise<AgencyCityCount[]> => {
    const { data } = await httpClient.get('/agencies/cities');
    return data;
  },

  // Super Admin-curated Titanium/Featured placement.
  setTier: async (id: string, input: SetAgencyTierInput): Promise<Agency> => {
    const { data } = await httpClient.patch(`/agencies/${id}/tier`, input);
    return mapAgencyRow(data);
  },

  findBySlug: async (slug: string): Promise<AgencyDetail> => {
    const { data } = await httpClient.get(`/agencies/${slug}`);
    return mapAgencyDetailRow(data);
  },

  getStats: async (slug: string): Promise<AgencyStats> => {
    const { data } = await httpClient.get(`/agencies/${slug}/stats`);
    return data;
  },

  create: async (input: CreateAgencyInput): Promise<Agency> => {
    const { data } = await httpClient.post('/agencies', input);
    return mapAgencyRow(data);
  },

  // Self-service — buyer registers a brand-new agency and becomes its
  // admin in one step. Both the agency and the caller's new agent profile
  // start 'pending'.
  registerSelfService: async (input: RegisterAgencyInput): Promise<{ agency: Agency; agentId: string }> => {
    const { data } = await httpClient.post('/agencies/register', input);
    return { agency: mapAgencyRow(data.agency), agentId: data.agentId };
  },

  update: async (id: string, input: UpdateAgencyInput): Promise<Agency> => {
    const { data } = await httpClient.patch(`/agencies/${id}`, input);
    return mapAgencyRow(data);
  },

  setVerificationStatus: async (id: string, input: SetAgencyVerificationStatusInput): Promise<Agency> => {
    const { data } = await httpClient.patch(`/agencies/${id}/verify`, input);
    return mapAgencyRow(data);
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/agencies/${id}`);
    return data;
  },

  // `file` is platform-specific (a browser File on web) — same untyped
  // convention as listingsRepository.uploadDocument.
  uploadDocument: async (agencyId: string, documentType: OnboardingDocumentType, file: any): Promise<OnboardingDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post(`/agencies/${agencyId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listDocuments: async (agencyId: string): Promise<OnboardingDocument[]> => {
    const { data } = await httpClient.get(`/agencies/${agencyId}/documents`);
    return data;
  },

  // Agency self-management ("Agency Staff") — server already returns
  // camelCase for these (agencies.repository.ts's newer methods), unlike
  // the rest of this file.
  listStaff: async (agencyId: string): Promise<AgencyStaffMember[]> => {
    const { data } = await httpClient.get(`/agencies/${agencyId}/staff`);
    return data;
  },

  addStaff: async (agencyId: string, input: CreateAgencyStaffInput): Promise<{ id: string }> => {
    const { data } = await httpClient.post(`/agencies/${agencyId}/staff`, input);
    return data;
  },

  setStaffAdmin: async (agencyId: string, agentId: string, isAgencyAdmin: boolean): Promise<{ id: string; isAgencyAdmin: boolean }> => {
    const { data } = await httpClient.patch(`/agencies/${agencyId}/staff/${agentId}/admin`, { isAgencyAdmin });
    return data;
  },

  removeStaff: async (agencyId: string, agentId: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/agencies/${agencyId}/staff/${agentId}`);
    return data;
  },

  // Admin-only agency-wide rollup (Document Verification Phase 3).
  getStaffAnalytics: async (agencyId: string): Promise<AgencyStaffAnalytics> => {
    const { data } = await httpClient.get(`/agencies/${agencyId}/analytics`);
    return data;
  },
};
