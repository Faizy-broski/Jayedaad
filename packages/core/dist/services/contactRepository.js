import { httpClient } from './httpClient';
export const contactRepository = {
    submit: async (input) => {
        await httpClient.post('/contact', input);
    },
};
