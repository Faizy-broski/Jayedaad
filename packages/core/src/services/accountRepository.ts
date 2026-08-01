import { httpClient } from './httpClient';

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

// Self-scoped counterpart to agentsRepository (agent-only) — the plain
// profile-update/account-deletion path any signed-in role can use on
// themselves. Mirrors services/api/src/account.
export const accountRepository = {
  getProfile: async (): Promise<OwnProfile> => {
    const { data } = await httpClient.get('/account/profile');
    return data;
  },

  updateProfile: async (input: UpdateOwnProfileInput): Promise<OwnProfile> => {
    const { data } = await httpClient.patch('/account/profile', input);
    return data;
  },

  // `file` is platform-specific (a browser File on web, a { uri, name, type }
  // asset object on React Native) — same untyped convention as
  // agentsRepository.uploadPhoto.
  uploadPhoto: async (file: any): Promise<OwnProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post('/account/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await httpClient.delete('/account');
  },
};
