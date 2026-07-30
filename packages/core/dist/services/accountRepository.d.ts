export interface UpdateOwnProfileInput {
    displayName?: string;
    phone?: string;
}
export interface OwnProfile {
    displayName: string | null;
    phone: string | null;
}
export declare const accountRepository: {
    updateProfile: (input: UpdateOwnProfileInput) => Promise<OwnProfile>;
    deleteAccount: () => Promise<void>;
};
