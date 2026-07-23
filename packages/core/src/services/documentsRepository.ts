import { httpClient } from './httpClient';
import { OnboardingDocument, OnboardingDocumentType } from '../models';

// Real onboarding requirement — company registration, owner's ID card, tax
// certificate — shared by both agencies (POST/GET /agencies/:id/documents)
// and independent agents (POST/GET /agents/:id/documents). Kept as a small
// generic wrapper rather than full agenciesRepository.ts/agentsRepository.ts
// client wrappers, which don't exist yet in packages/core and are a much
// larger, separate scope than this document feature.
function buildFormData(documentType: OnboardingDocumentType, file: any): FormData {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);
  return formData;
}

export const documentsRepository = {
  uploadAgencyDocument: async (
    agencyId: string,
    documentType: OnboardingDocumentType,
    file: any,
  ): Promise<OnboardingDocument> => {
    const { data } = await httpClient.post(`/agencies/${agencyId}/documents`, buildFormData(documentType, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listAgencyDocuments: async (agencyId: string): Promise<OnboardingDocument[]> => {
    const { data } = await httpClient.get(`/agencies/${agencyId}/documents`);
    return data;
  },

  uploadAgentDocument: async (
    agentId: string,
    documentType: OnboardingDocumentType,
    file: any,
  ): Promise<OnboardingDocument> => {
    const { data } = await httpClient.post(`/agents/${agentId}/documents`, buildFormData(documentType, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listAgentDocuments: async (agentId: string): Promise<OnboardingDocument[]> => {
    const { data } = await httpClient.get(`/agents/${agentId}/documents`);
    return data;
  },
};
