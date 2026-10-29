import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export function registerHealthRoutes(app: FastifyInstance): void {
    let ready = false;
    app.addHook('onReady', async () => {
        ready = true;
    });
    app.addHook('preClose', async () => {
        ready = false;
    });
    const server = app.withTypeProvider<ZodTypeProvider>();
    const schema = z.object({ status: z.enum(['ok', 'ready', 'unavailable']) });
    server.get(
        '/health/live',
        {
            config: { rateLimit: false },
            schema: { tags: ['health'], response: { 200: schema } },
        },
        async () => ({ status: 'ok' as const }),
    );
    server.get(
        '/health/ready',
        {
            config: { rateLimit: false },
            schema: { tags: ['health'], response: { 200: schema, 503: schema } },
        },
        async (_request, reply) =>
            reply.code(ready ? 200 : 503).send({ status: ready ? 'ready' : 'unavailable' }),
    );
}
