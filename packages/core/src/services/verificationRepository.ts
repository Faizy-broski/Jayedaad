import { httpClient } from './httpClient';
import { Listing } from '../models';

export type VerificationAction = 'approve' | 'reject' | 'request-info';

export const verificationRepository = {
  queue: async (): Promise<Listing[]> => {
    const { data } = await httpClient.get('/verification/queue');
    return data;
  },

  act: async ({ listingId, action, note }: { listingId: string; action: VerificationAction; note?: string }) => {
    const { data } = await httpClient.post(`/verification/${listingId}/${action}`, { note });
    return data;
  },
};
