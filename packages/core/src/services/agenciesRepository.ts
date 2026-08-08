import { httpClient } from './httpClient';
import {
  Agency,
  AgencyStaffAnalytics,
  AgencyStaffMember,
  AgencyStats,
  CreateAgencyInput,
  CreateAgencyStaffInput,
  OnboardingDocument,
  OnboardingDocumentType,
  RegisterAgencyInput,
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
    salesAssociateCount: row.sales_associate_count,
  };
}

export const agenciesRepository = {
  list: async (filters: { city?: string } = {}): Promise<Agency[]> => {
    const { data } = await httpClient.get('/agencies', { params: filters });
    return (data as any[]).map(mapAgencyRow);
  },

  findBySlug: async (slug: string): Promise<Agency> => {
    const { data } = await httpClient.get(`/agencies/${slug}`);
    return mapAgencyRow(data);
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
