import { httpClient } from './httpClient';
import { Notification } from '../models';

// services/api/src/notifications/notifications.repository.ts returns raw
// snake_case Supabase rows (no server-side mapper) — mapped here, same
// convention as agenciesRepository.ts/leadsRepository.ts. `userId` is
// deliberately not part of the shared Notification model (every list here
// is always "my own"), so it's read but not mapped through.
function mapNotificationRow(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedListingId: row.related_listing_id,
    relatedLeadId: row.related_lead_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export const notificationsRepository = {
  list: async (): Promise<Notification[]> => {
    const { data } = await httpClient.get('/notifications');
    return (data ?? []).map(mapNotificationRow);
  },

  markRead: async (id: string): Promise<Notification> => {
    const { data } = await httpClient.patch(`/notifications/${id}/read`);
    return mapNotificationRow(data);
  },

  markAllRead: async (): Promise<void> => {
    await httpClient.patch('/notifications/read-all');
  },
};
