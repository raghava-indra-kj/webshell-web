import { AxiosHeaders, isAxiosError, isCancel, type RawAxiosHeaders } from 'axios';
import { ApiError, ApiErrorKind } from './api-error';

/** Represents normalized, optional problem details from an API response. */
export type ApiProblemDetails = { problemType?: string; title?: string; detail?: string; requestId?: string };

type ApiErrorMappingOptions = { service: string; extractProblem?: (data: unknown) => ApiProblemDetails | undefined };

/** Returns a non-empty string when available. */
function getString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }

    return undefined;
}

/** Extracts RFC 9457 problem details from a JSON response. */
function parseProblemDetails(data: unknown): ApiProblemDetails | undefined {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return undefined;
    }

    const problem = data as Record<string, unknown>;

    return {
        problemType: getString(problem.type),
        title: getString(problem.title),
        detail: getString(problem.detail),
        requestId: getString(problem.requestId),
    };
}

/** Parses the Retry-After header expressed as seconds or an HTTP date. */
function parseRetryAfterMs(value: unknown): number | undefined {
    const text = getString(value);

    if (text === undefined) {
        return undefined;
    }

    if (/^\d+$/.test(text)) {
        const seconds = Number(text);

        if (Number.isSafeInteger(seconds) && seconds <= Number.MAX_SAFE_INTEGER / 1000) {
            return seconds * 1000;
        }

        return undefined;
    }

    const date = Date.parse(text);

    if (Number.isFinite(date)) {
        return Math.max(0, date - Date.now());
    }

    return undefined;
}

/** Normalizes Axios failures while preserving cancellation and unrelated exceptions. */
export function mapApiError(error: unknown, { service, extractProblem }: ApiErrorMappingOptions): unknown {
    if (error instanceof ApiError || isCancel(error) || !isAxiosError(error)) {
        return error;
    }

    if (error.response) {
        const { status, data, headers } = error.response;
        const responseHeaders = AxiosHeaders.from(headers as RawAxiosHeaders);

        const contentType = getString(responseHeaders.get('content-type'));
        const isProblemResponse = contentType?.toLowerCase().startsWith('application/problem+json') === true;

        let problem = extractProblem?.(data);

        if (problem === undefined && isProblemResponse) {
            problem = parseProblemDetails(data);
        }

        const requestId = problem?.requestId ?? getString(responseHeaders.get('x-request-id'));
        const retryAfterMs = parseRetryAfterMs(responseHeaders.get('retry-after'));

        return new ApiError({
            kind: ApiErrorKind.Http,
            service,
            status,
            problemType: problem?.problemType,
            title: problem?.title,
            detail: problem?.detail,
            requestId,
            retryAfterMs,
            cause: error,
        });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return new ApiError({ kind: ApiErrorKind.Timeout, service, cause: error });
    }

    if (error.code === 'ERR_NETWORK' || error.request) {
        return new ApiError({ kind: ApiErrorKind.Network, service, cause: error });
    }

    return error;
}
