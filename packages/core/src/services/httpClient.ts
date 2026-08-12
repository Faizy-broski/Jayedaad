import axios, { AxiosInstance } from 'axios';

// One http client instance shared by every repository. Each app (web/mobile)
// calls configureHttpClient() once at startup with its own base URL and token
// getter — core stays framework-agnostic (no next/expo env imports here).
//
// timeout: previously unset, so a hung backend (e.g. an exhausted rate-limit
// bucket, or any other stall) left a request pending indefinitely — a
// screen just sat looking "empty" with no way to distinguish that from a
// genuinely empty result, no error ever fired.
export const httpClient: AxiosInstance = axios.create({ timeout: 15_000 });

let getToken: () => string | undefined = () => undefined;

export function configureHttpClient(options: { baseURL: string; getToken: () => string | undefined }) {
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

// Tags every failed response with `isRateLimited`/`userMessage` — every
// call site's existing `err?.response?.data?.message` access still works
// unchanged (the response object itself is untouched, only new properties
// are added to the Error), but callers/UI that want to distinguish "the
// server is rate-limiting us" from an ordinary validation error, or just
// want a ready-made user-facing string, can now do so instead of every
// screen re-deriving it (or, as found across ~19 screens, not handling the
// failure at all and rendering it identically to a real empty result).
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    error.isRateLimited = status === 429;
    error.userMessage = error.isRateLimited
      ? 'Too many requests — please wait a moment and try again.'
      : status >= 500
        ? 'Something went wrong on our end — please try again.'
        : (error?.response?.data?.message ?? error?.message ?? 'Something went wrong — please try again.');
    return Promise.reject(error);
  },
);
