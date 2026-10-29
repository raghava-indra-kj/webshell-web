import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env.js';

export async function registerOpenApi(app: FastifyInstance, env: Env): Promise<void> {
    await app.register(swagger, {
        openapi: { info: { title: env.appName, version: '0.1.0' } },
        transform: jsonSchemaTransform,
    });
    if (env.apiDocsEnabled) {
        await app.register(swaggerUi, { routePrefix: '/docs' });
    }
}
