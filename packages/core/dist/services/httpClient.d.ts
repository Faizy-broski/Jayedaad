import { AxiosInstance } from 'axios';
export declare const httpClient: AxiosInstance;
export declare function configureHttpClient(options: {
    baseURL: string;
    getToken: () => string | undefined;
}): void;
