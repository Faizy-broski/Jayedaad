import { Listing, PaginatedAuditLog } from '../models';
export type VerificationAction = 'approve' | 'reject' | 'request-info';
export interface AuditLogFilters {
    listingId?: string;
    reviewerId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
export declare const verificationRepository: {
    queue: () => Promise<Listing[]>;
    act: ({ listingId, action, note }: {
        listingId: string;
        action: VerificationAction;
        note?: string;
    }) => Promise<any>;
    auditLog: (filters?: AuditLogFilters) => Promise<PaginatedAuditLog>;
};
