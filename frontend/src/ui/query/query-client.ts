import { QueryClient } from '@tanstack/react-query';
import { ApiError, ApiErrorKind } from '../../infra/api/api-error';

const MAX_QUERY_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 30_000;

/** Determines whether a failed query can be retried automatically. */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
    if (failureCount >= MAX_QUERY_RETRIES || !(error instanceof ApiError)) {
        return false;
    }

    if (error.retryAfterMs !== undefined && error.retryAfterMs > MAX_RETRY_DELAY_MS) {
        return false;
    }

    if (error.kind === ApiErrorKind.Network || error.kind === ApiErrorKind.Timeout) {
        return true;
    }

    if (error.kind !== ApiErrorKind.Http) {
        return false;
    }

    return (
        error.status === 408 ||
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 504
    );
}

/** Calculates a bounded retry delay while respecting server guidance. */
function getRetryDelay(attemptIndex: number, error: unknown): number {
    if (error instanceof ApiError && error.retryAfterMs !== undefined) {
        return error.retryAfterMs;
    }

    return Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}

/** Creates a QueryClient with shared retry defaults. */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: shouldRetryQuery, retryDelay: getRetryDelay },
            mutations: { retry: false },
        },
    });
}
