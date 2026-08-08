import { httpClient } from './httpClient';
import { OwnerIdentityDocument, OwnerIdentityDocumentType, OwnerVerificationSummary, PendingOwnerVerification } from '../models';

// Backs the one-time owner identity verification gate on Post Listing.
// Mirrors services/api/src/owners/owners.controller.ts's endpoints.
export const ownersRepository = {
  // Self-service buyer -> owner promotion — the missing link a fresh signup
  // needs before any of the endpoints below (all @Roles('owner')-gated
  // server-side) become reachable. No approval step.
  becomeOwner: async (): Promise<{ userId: string; role: 'owner' }> => {
    const { data } = await httpClient.post('/owners/become-owner');
    return data;
  },

  getMyVerification: async (): Promise<OwnerVerificationSummary> => {
    const { data } = await httpClient.get('/owners/me/verification');
    return data;
  },

  // `file` is platform-specific (a browser File on web, a { uri, name, type }
  // asset object on React Native) — same untyped convention as
  // agentsRepository.uploadDocument/listingsRepository.uploadDocument.
  uploadDocument: async (documentType: OwnerIdentityDocumentType, file: any): Promise<OwnerVerificationSummary['documents'][number]> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post('/owners/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Staff review queue — super_admin/verification_staff only server-side.
  listPendingVerification: async (): Promise<PendingOwnerVerification[]> => {
    const { data } = await httpClient.get('/owners/pending-verification');
    return data;
  },

  // Admin-only — the actual CNIC/selfie rows (with signed URLs) for a
  // specific owner, not just the completeness counts pending-verification
  // returns. Mirrors agentsRepository.listDocuments.
  listDocuments: async (userId: string): Promise<OwnerIdentityDocument[]> => {
    const { data } = await httpClient.get(`/owners/${userId}/documents`);
    return data;
  },

  // Admin upload-on-behalf — mirrors agentsRepository.uploadDocument's
  // shape (id + documentType + file), unlike this file's own self-scoped
  // uploadDocument above (POST /owners/me/documents, no id param).
  uploadDocumentForUser: async (userId: string, documentType: OwnerIdentityDocumentType, file: any): Promise<OwnerIdentityDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post(`/owners/${userId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  setVerificationStatus: async (userId: string, status: 'verified' | 'rejected'): Promise<{ userId: string; status: string; reviewedAt: string | null }> => {
    const { data } = await httpClient.patch(`/owners/${userId}/verify`, { status });
    return data;
  },
};
