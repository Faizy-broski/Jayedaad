import { httpClient } from './httpClient';
// services/api/src/verification/verification.repository.ts::listAuditLog
// returns raw snake_case rows — mapped here to VerificationAuditLogEntry.
function mapAuditLogRow(row) {
    return {
        id: row.id,
        listingId: row.listing_id,
        reviewerId: row.reviewer_id,
        action: row.action,
        note: row.note,
        createdAt: row.created_at,
    };
}
export const verificationRepository = {
    queue: async () => {
        const { data } = await httpClient.get('/verification/queue');
        return data;
    },
    act: async ({ listingId, action, note }) => {
        const { data } = await httpClient.post(`/verification/${listingId}/${action}`, { note });
        return data;
    },
    // Super Admin-only.
    auditLog: async (filters = {}) => {
        const { data } = await httpClient.get('/verification/audit-log', { params: filters });
        return { ...data, items: data.items.map(mapAuditLogRow) };
    },
};
