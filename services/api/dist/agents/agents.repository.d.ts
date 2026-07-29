import { SupabaseService } from '../supabase/supabase.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateAgentProfileDto } from './dto/update-profile.dto';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { DocumentsService } from '../documents/documents.service';
import { OnboardingDocumentType } from '../agencies/agencies.repository';
export declare class AgentsRepository {
    private readonly supabase;
    private readonly documents;
    constructor(supabase: SupabaseService, documents: DocumentsService);
    private mapProfileRow;
    findProfile(agentId: string): Promise<{
        id: any;
        displayName: any;
        title: any;
        bio: any;
        phone: any;
        whatsapp: any;
        landline: any;
        city: any;
        address: any;
        photoUrl: any;
        verificationStatus: any;
        agency: any;
    }>;
    updateProfile(agentId: string, input: UpdateAgentProfileDto): Promise<{
        id: any;
        displayName: any;
        title: any;
        bio: any;
        phone: any;
        whatsapp: any;
        landline: any;
        city: any;
        address: any;
        photoUrl: any;
        verificationStatus: any;
        agency: any;
    }>;
    updatePhoto(agentId: string, photoUrl: string): Promise<{
        id: any;
        displayName: any;
        title: any;
        bio: any;
        phone: any;
        whatsapp: any;
        landline: any;
        city: any;
        address: any;
        photoUrl: any;
        verificationStatus: any;
        agency: any;
    }>;
    getStats(agentId: string): Promise<{
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
    getAnalytics(agentId: string, filters?: {
        purpose?: 'sale' | 'rent';
        since?: Date;
    }): Promise<{
        views: number;
        clicks: number;
        leads: number;
        calls: number;
        whatsapp: number;
        sms: number;
        emails: number;
    }>;
    getCredits(agentId: string): Promise<{
        creditType: any;
        total: any;
        used: any;
        available: number;
    }[]>;
    grantCredits(agentId: string, input: GrantCreditsDto): Promise<{
        creditType: any;
        total: any;
        used: any;
        available: number;
    }>;
    listReviews(agentId: string): Promise<{
        id: any;
        agent_id: any;
        reviewer_id: any;
        rating: any;
        body: any;
        created_at: any;
    }[]>;
    createReview(reviewerId: string, agentId: string, input: CreateReviewDto): Promise<any>;
    addDocument(agentId: string, documentType: OnboardingDocumentType, file: Express.Multer.File): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }>;
    listDocuments(agentId: string): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }[]>;
    getDocumentCompleteness(agentId: string): Promise<{
        required: OnboardingDocumentType[];
        uploaded: OnboardingDocumentType[];
        missing: OnboardingDocumentType[];
    }>;
    setVerificationStatus(agentId: string, status: 'verified' | 'rejected'): Promise<{
        id: any;
        displayName: any;
        title: any;
        bio: any;
        phone: any;
        whatsapp: any;
        landline: any;
        city: any;
        address: any;
        photoUrl: any;
        verificationStatus: any;
        agency: any;
    }>;
}
