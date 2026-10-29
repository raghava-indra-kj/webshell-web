import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env.js';

export async function registerSecurity(app: FastifyInstance, env: Env): Promise<void> {
    await app.register(helmet);
    await app.register(cors, {
        origin: env.corsOrigins.length ? env.corsOrigins : false,
        credentials: false,
    });
    // Process-local protection; use a shared store or gateway when scaling to multiple replicas.
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
}
