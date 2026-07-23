import { SupabaseService } from '../supabase/supabase.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { DocumentsService } from '../documents/documents.service';
export type OnboardingDocumentType = 'company_registration' | 'owner_id_card' | 'tax_certificate';
export declare const REQUIRED_ONBOARDING_DOCUMENT_TYPES: OnboardingDocumentType[];
export declare class AgenciesRepository {
    private readonly supabase;
    private readonly documents;
    constructor(supabase: SupabaseService, documents: DocumentsService);
    list(filters?: {
        city?: string;
    }): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        email: any;
        city: any;
        address: any;
        business_hours: any;
        verification_status: any;
    }[]>;
    findBySlug(slug: string): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        email: any;
        city: any;
        address: any;
        business_hours: any;
        verification_status: any;
        agent_profiles: {
            id: any;
            display_name: any;
            title: any;
            photo_url: any;
        }[];
    }>;
    getStats(agencyId: string): Promise<{
        forSaleCount: number;
        forRentCount: number;
        byPropertyType: {
            forSale: number;
            forRent: number;
            label: string;
        }[];
        byBoostTier: {
            tier: string;
            count: number;
        }[];
    }>;
    create(input: CreateAgencyDto): Promise<any>;
    setVerificationStatus(id: string, status: 'verified' | 'rejected'): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        email: any;
        city: any;
        address: any;
        business_hours: any;
        verification_status: any;
    }>;
    update(id: string, input: UpdateAgencyDto): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        email: any;
        city: any;
        address: any;
        business_hours: any;
        verification_status: any;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
    addDocument(agencyId: string, documentType: OnboardingDocumentType, file: Express.Multer.File): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }>;
    listDocuments(agencyId: string): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }[]>;
    getDocumentCompleteness(agencyId: string): Promise<{
        required: OnboardingDocumentType[];
        uploaded: OnboardingDocumentType[];
        missing: OnboardingDocumentType[];
    }>;
    private assertDocumentsComplete;
}
