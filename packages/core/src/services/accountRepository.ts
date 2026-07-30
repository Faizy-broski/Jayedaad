import { httpClient } from './httpClient';

export interface UpdateOwnProfileInput {
  displayName?: string;
  phone?: string;
}

export interface OwnProfile {
  displayName: string | null;
  phone: string | null;
}

// Self-scoped counterpart to agentsRepository (agent-only) — the plain
// profile-update/account-deletion path any signed-in role can use on
// themselves. Mirrors services/api/src/account.
export const accountRepository = {
  updateProfile: async (input: UpdateOwnProfileInput): Promise<OwnProfile> => {
    const { data } = await httpClient.patch('/account/profile', input);
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await httpClient.delete('/account');
  },
};
