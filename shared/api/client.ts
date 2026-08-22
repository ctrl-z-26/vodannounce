import axios, { type AxiosInstance } from 'axios';

/** Configuration for {@link createApiClient}. */
export interface ApiConfig {
    /** Base URL of the Express backend, e.g. `http://localhost:3000`. */
    baseUrl: string;
    /**
     * Resolves the bearer token to attach to every request, or `null` when
     * unauthenticated. May be sync or async; owned by the consuming app
     * (e.g. reads the Supabase session) so shared stays auth-provider-agnostic.
     */
    getToken: () => Promise<string | null> | string | null;
    /** Optional callback invoked when the backend responds with 401. */
    onUnauthorized?: () => void;
}

/**
 * Creates a preconfigured axios instance for the Vodannounce API.
 *
 * Owns transport concerns only: base URL, JSON content type, bearer-token
 * injection and 401 handling. Auth flow, token storage and login/logout stay
 * in each consuming app.
 *
 * @param config - Base URL plus a token resolver and optional 401 callback.
 * @returns An axios instance; consumers may layer additional interceptors.
 */
export const createApiClient = ({
    baseUrl,
    getToken,
    onUnauthorized,
}: ApiConfig): AxiosInstance => {
    const api = axios.create({
        baseURL: baseUrl,
        headers: { 'Content-Type': 'application/json' },
    });

    api.interceptors.request.use(async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401 && onUnauthorized) {
                onUnauthorized();
            }
            return Promise.reject(error);
        },
    );

    return api;
};
