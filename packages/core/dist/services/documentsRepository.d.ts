import { OnboardingDocument, OnboardingDocumentType } from '../models';
export declare const documentsRepository: {
    uploadAgencyDocument: (agencyId: string, documentType: OnboardingDocumentType, file: any) => Promise<OnboardingDocument>;
    listAgencyDocuments: (agencyId: string) => Promise<OnboardingDocument[]>;
    uploadAgentDocument: (agentId: string, documentType: OnboardingDocumentType, file: any) => Promise<OnboardingDocument>;
    listAgentDocuments: (agentId: string) => Promise<OnboardingDocument[]>;
};
