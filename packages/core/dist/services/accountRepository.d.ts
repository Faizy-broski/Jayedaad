export interface UpdateOwnProfileInput {
    displayName?: string;
    phone?: string;
}
export interface OwnProfile {
    displayName: string | null;
    phone: string | null;
    email: string | null;
    photoUrl: string | null;
}
export declare const accountRepository: {
    getProfile: () => Promise<OwnProfile>;
    updateProfile: (input: UpdateOwnProfileInput) => Promise<OwnProfile>;
    uploadPhoto: (file: any) => Promise<OwnProfile>;
    deleteAccount: () => Promise<void>;
};
