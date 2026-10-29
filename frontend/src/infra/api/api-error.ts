import { AppError } from '../../core/errors/app-error';

/** Identifies the category of an API failure. */
export const ApiErrorKind = {
    Network: 'network',
    Timeout: 'timeout',
    Http: 'http',
    InvalidResponse: 'invalid-response',
} as const;

export type ApiErrorKind = (typeof ApiErrorKind)[keyof typeof ApiErrorKind];

type ApiErrorParams = {
    kind: ApiErrorKind;
    service: string;
    status?: number;
    problemType?: string;
    title?: string;
    detail?: string;
    requestId?: string;
    retryAfterMs?: number;
    cause?: unknown;
};

/** Represents a normalized API failure with optional RFC 9457 problem details. */
export class ApiError extends AppError {
    readonly kind: ApiErrorKind;
    readonly service: string;
    readonly status?: number;
    readonly problemType?: string;
    readonly title?: string;
    readonly detail?: string;
    readonly requestId?: string;
    readonly retryAfterMs?: number;

    constructor({ kind, service, status, problemType, title, detail, requestId, retryAfterMs, cause }: ApiErrorParams) {
        let message: string;

        if (status !== undefined) {
            message = `API request failed (${service}): HTTP ${status}.`;
        } else {
            message = `API request failed (${service}): ${kind}.`;
        }

        super({ message, cause });

        this.name = 'ApiError';
        this.kind = kind;
        this.service = service;
        this.status = status;
        this.problemType = problemType;
        this.title = title;
        this.detail = detail;
        this.requestId = requestId;
        this.retryAfterMs = retryAfterMs;
    }
}
