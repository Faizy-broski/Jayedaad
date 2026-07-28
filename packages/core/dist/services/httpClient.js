import axios from 'axios';
// One http client instance shared by every repository. Each app (web/mobile)
// calls configureHttpClient() once at startup with its own base URL and token
// getter — core stays framework-agnostic (no next/expo env imports here).
export const httpClient = axios.create();
let getToken = () => undefined;
export function configureHttpClient(options) {
    httpClient.defaults.baseURL = options.baseURL;
    getToken = options.getToken;
}
httpClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
