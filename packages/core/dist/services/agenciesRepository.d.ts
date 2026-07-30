import { Agency, AgencyStats, CreateAgencyInput, ListingDocument, OnboardingDocumentType, SetAgencyVerificationStatusInput, UpdateAgencyInput } from '../models';
export declare const agenciesRepository: {
    list: (filters?: {
        city?: string;
    }) => Promise<Agency[]>;
    findBySlug: (slug: string) => Promise<Agency>;
    getStats: (slug: string) => Promise<AgencyStats>;
    create: (input: CreateAgencyInput) => Promise<Agency>;
    update: (id: string, input: UpdateAgencyInput) => Promise<Agency>;
    setVerificationStatus: (id: string, input: SetAgencyVerificationStatusInput) => Promise<Agency>;
    remove: (id: string) => Promise<{
        id: string;
    }>;
    uploadDocument: (agencyId: string, documentType: OnboardingDocumentType, file: any) => Promise<ListingDocument>;
    listDocuments: (agencyId: string) => Promise<ListingDocument[]>;
};
