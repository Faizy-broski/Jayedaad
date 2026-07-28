import { Listing } from '../models';
export type VerificationAction = 'approve' | 'reject' | 'request-info';
export declare const verificationRepository: {
    queue: () => Promise<Listing[]>;
    act: ({ listingId, action, note }: {
        listingId: string;
        action: VerificationAction;
        note?: string;
    }) => Promise<any>;
};
