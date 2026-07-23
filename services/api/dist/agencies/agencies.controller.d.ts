import { AgenciesRepository } from './agencies.repository';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { SetAgencyVerificationStatusDto } from './dto/set-verification-status.dto';
import { UploadOnboardingDocumentDto } from './dto/upload-document.dto';
export declare class AgenciesController {
    private readonly agencies;
    constructor(agencies: AgenciesRepository);
    list(city?: string): Promise<{
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
    getStats(slug: string): Promise<{
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
    create(body: CreateAgencyDto): Promise<any>;
    setVerificationStatus(id: string, body: SetAgencyVerificationStatusDto): Promise<{
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
    update(id: string, body: UpdateAgencyDto): Promise<{
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
    uploadDocument(id: string, body: UploadOnboardingDocumentDto, file: Express.Multer.File): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }>;
    listDocuments(id: string): Promise<{
        id: any;
        documentType: any;
        url: string;
        uploadedAt: any;
    }[]>;
}
