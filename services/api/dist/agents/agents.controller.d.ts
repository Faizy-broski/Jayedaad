import { AgentsRepository } from './agents.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateAgentProfileDto } from './dto/update-profile.dto';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { UploadOnboardingDocumentDto } from './dto/upload-document.dto';
import { SetAgentVerificationStatusDto } from './dto/set-verification-status.dto';
import { AvatarMediaService } from './avatar-media.service';
export declare class AgentsController {
    private readonly agents;
    private readonly avatarMedia;
    constructor(agents: AgentsRepository, avatarMedia: AvatarMediaService);
    findProfile(id: string): Promise<{
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
    listReviews(id: string): Promise<{
        id: any;
        agent_id: any;
        reviewer_id: any;
        rating: any;
        body: any;
        created_at: any;
    }[]>;
    getStats(id: string): Promise<{
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
    getAnalytics(req: any, id: string, purpose?: 'sale' | 'rent', since?: string): Promise<{
        views: number;
        clicks: number;
        leads: number;
        calls: number;
        whatsapp: number;
        sms: number;
        emails: number;
    }>;
    getCredits(req: any, id: string): Promise<{
        creditType: any;
        total: any;
        used: any;
        available: number;
    }[]>;
    grantCredits(id: string, body: GrantCreditsDto): Promise<{
        creditType: any;
        total: any;
        used: any;
        available: number;
    }>;
    updateProfile(req: any, id: string, body: UpdateAgentProfileDto): Promise<{
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
    uploadPhoto(req: any, id: string, file: Express.Multer.File): Promise<{
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
    private assertOwnAgentOrAdmin;
    createReview(req: any, id: string, body: CreateReviewDto): Promise<any>;
    uploadDocument(req: any, id: string, body: UploadOnboardingDocumentDto, file: Express.Multer.File): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }>;
    listDocuments(req: any, id: string): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }[]>;
    setVerificationStatus(id: string, body: SetAgentVerificationStatusDto): Promise<{
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
