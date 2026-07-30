import { AuditLogFilters } from '../services/verificationRepository';
export declare function useVerificationAuditLogViewModel(filters?: AuditLogFilters): {
    entries: import("..").VerificationAuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
};
