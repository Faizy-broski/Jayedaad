import { VerificationRepository } from './verification.repository';
export declare class VerificationController {
    private readonly verification;
    constructor(verification: VerificationRepository);
    queue(): Promise<any[]>;
    approve(req: any, id: string, note?: string): Promise<void>;
    reject(req: any, id: string, note?: string): Promise<void>;
    requestInfo(req: any, id: string, note?: string): Promise<void>;
    auditLog(listingId?: string, reviewerId?: string, dateFrom?: string, dateTo?: string, page?: string, pageSize?: string): Promise<{
        items: {
            id: any;
            listing_id: any;
            reviewer_id: any;
            action: any;
            note: any;
            created_at: any;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
