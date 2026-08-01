import { Agency, AgencyStaffMember, AgencyStats, CreateAgencyInput, CreateAgencyStaffInput, OnboardingDocument, OnboardingDocumentType, RegisterAgencyInput, SetAgencyVerificationStatusInput, UpdateAgencyInput } from '../models';
export declare const agenciesRepository: {
    list: (filters?: {
        city?: string;
    }) => Promise<Agency[]>;
    findBySlug: (slug: string) => Promise<Agency>;
    getStats: (slug: string) => Promise<AgencyStats>;
    create: (input: CreateAgencyInput) => Promise<Agency>;
    registerSelfService: (input: RegisterAgencyInput) => Promise<{
        agency: Agency;
        agentId: string;
    }>;
    update: (id: string, input: UpdateAgencyInput) => Promise<Agency>;
    setVerificationStatus: (id: string, input: SetAgencyVerificationStatusInput) => Promise<Agency>;
    remove: (id: string) => Promise<{
        id: string;
    }>;
    uploadDocument: (agencyId: string, documentType: OnboardingDocumentType, file: any) => Promise<OnboardingDocument>;
    listDocuments: (agencyId: string) => Promise<OnboardingDocument[]>;
    listStaff: (agencyId: string) => Promise<AgencyStaffMember[]>;
    addStaff: (agencyId: string, input: CreateAgencyStaffInput) => Promise<{
        id: string;
    }>;
    setStaffAdmin: (agencyId: string, agentId: string, isAgencyAdmin: boolean) => Promise<{
        id: string;
        isAgencyAdmin: boolean;
    }>;
    removeStaff: (agencyId: string, agentId: string) => Promise<{
        id: string;
    }>;
};
