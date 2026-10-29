import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { mapApiError, type ApiProblemDetails } from './api-error-mapper';

type CreateApiClientOptions = {
    service: string;
    baseURL: string;
    timeoutMs?: number;
    configure?: (client: AxiosInstance) => void;
    extractProblem?: (data: unknown) => ApiProblemDetails | undefined;
};

/** Defines the shared API request contract. */
export type ApiClient = { request<TData = unknown>(config: AxiosRequestConfig): Promise<TData> };

/**
 * Creates an independent API client with standardized error handling.
 *
 * Security Note:
 * Axios allows an absolute request URL to override the configured `baseURL`.
 * When authentication interceptors are configured, restrict credential attachment
 * to approved service origins and avoid passing untrusted URLs into authenticated clients.
 * Maintain separate client instances for distinct services.
 */
export function createApiClient({
    service,
    baseURL,
    timeoutMs = 15000,
    configure,
    extractProblem,
}: CreateApiClientOptions): ApiClient {
    const client = axios.create({ baseURL, timeout: timeoutMs });

    configure?.(client);

    return {
        async request<TData = unknown>(config: AxiosRequestConfig): Promise<TData> {
            try {
                const response = await client.request<TData>(config);
                return response.data;
            } catch (error) {
                throw mapApiError(error, { service, extractProblem });
            }
        },
    };
}
