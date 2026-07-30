import { httpClient } from './httpClient';
// Self-scoped counterpart to agentsRepository (agent-only) — the plain
// profile-update/account-deletion path any signed-in role can use on
// themselves. Mirrors services/api/src/account.
export const accountRepository = {
    updateProfile: async (input) => {
        const { data } = await httpClient.patch('/account/profile', input);
        return data;
    },
    deleteAccount: async () => {
        await httpClient.delete('/account');
    },
};
