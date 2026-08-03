import { httpClient } from './httpClient';
// Self-scoped counterpart to agentsRepository (agent-only) — the plain
// profile-update/account-deletion path any signed-in role can use on
// themselves. Mirrors services/api/src/account.
export const accountRepository = {
    getProfile: async () => {
        const { data } = await httpClient.get('/account/profile');
        return data;
    },
    updateProfile: async (input) => {
        const { data } = await httpClient.patch('/account/profile', input);
        return data;
    },
    // `file` is platform-specific (a browser File on web, a { uri, name, type }
    // asset object on React Native) — same untyped convention as
    // agentsRepository.uploadPhoto.
    uploadPhoto: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await httpClient.post('/account/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    deleteAccount: async () => {
        await httpClient.delete('/account');
    },
};
