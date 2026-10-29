import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

export function generateRequestId(): string {
    return randomUUID();
}

export function registerRequestContext(app: FastifyInstance): void {
    app.addHook('onRequest', async (request, reply) => {
        reply.header('x-request-id', request.id);
    });
}
