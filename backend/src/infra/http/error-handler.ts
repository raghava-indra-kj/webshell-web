import type { FastifyError, FastifyInstance } from 'fastify';
import { mapToAppError } from '../../core/errors/app-error-mapper.js';
import { createProblem } from './problem-details.js';

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error, request, reply) => {
        const httpError = error instanceof Error ? (error as FastifyError) : undefined;
        if (httpError?.validation) {
            return reply
                .code(400)
                .type('application/problem+json')
                .send(
                    createProblem({
                        status: 400,
                        code: 'VALIDATION_ERROR',
                        detail: 'Request validation failed.',
                        requestId: request.id,
                        errors: httpError.validation.map((issue) => ({
                            path: issue.instancePath ?? '',
                            message: issue.message ?? 'Invalid value',
                        })),
                    }),
                );
        }
        const status = httpError?.statusCode;
        if (status && status >= 400 && status < 500) {
            return reply
                .code(status)
                .type('application/problem+json')
                .send(
                    createProblem({
                        status,
                        code: status === 429 ? 'RATE_LIMITED' : 'REQUEST_REJECTED',
                        detail:
                            status === 429
                                ? 'Too many requests. Try again later.'
                                : 'The request could not be accepted.',
                        requestId: request.id,
                    }),
                );
        }
        request.log.error({ err: mapToAppError(error) }, 'Request failed');
        return reply
            .code(500)
            .type('application/problem+json')
            .send(
                createProblem({
                    status: 500,
                    code: 'INTERNAL_ERROR',
                    detail: 'An unexpected error occurred.',
                    requestId: request.id,
                }),
            );
    });
    app.setNotFoundHandler((request, reply) =>
        reply
            .code(404)
            .type('application/problem+json')
            .send(
                createProblem({
                    status: 404,
                    code: 'ROUTE_NOT_FOUND',
                    detail: 'Route was not found.',
                    requestId: request.id,
                }),
            ),
    );
}
