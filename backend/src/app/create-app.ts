import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { Env } from '../infra/config/env.js';
import { createLoggerOptions } from '../infra/logging/logger.js';
import { generateRequestId, registerRequestContext } from '../infra/http/request-context.js';
import { registerErrorHandler } from '../infra/http/error-handler.js';
import { registerSecurity } from '../infra/http/security.js';
import { registerOpenApi } from '../infra/http/openapi.js';
import { registerHealthRoutes } from '../infra/http/health.routes.js';
import { registerProjects } from '../modules/projects/projects.module.js';
import { createDependencies, type AppDependencies } from './create-dependencies.js';

export async function createApp(options: {
    env: Env;
    dependencies?: AppDependencies;
}): Promise<FastifyInstance> {
    const { env } = options;
    if (env.nodeEnv === 'production' && env.exampleModuleEnabled) {
        throw new Error('In-memory example storage is not permitted in production.');
    }
    const dependencies = options.dependencies ?? createDependencies(env);
    if (env.exampleModuleEnabled && !dependencies.projects) {
        throw new Error('Projects dependencies are required when the example module is enabled.');
    }
    const app = Fastify({
        logger: createLoggerOptions(env),
        genReqId: generateRequestId,
        requestIdHeader: false,
        trustProxy: false,
        bodyLimit: 1024 * 1024,
        requestTimeout: 30_000,
        connectionTimeout: 10_000,
        keepAliveTimeout: 5_000,
        return503OnClosing: true,
    });
    try {
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);
        registerRequestContext(app);
        registerErrorHandler(app);
        await registerSecurity(app, env);
        await registerOpenApi(app, env);
        registerHealthRoutes(app);
        if (env.exampleModuleEnabled && dependencies.projects) {
            await app.register(registerProjects, { prefix: '/api/v1', ...dependencies.projects });
        }
        await app.ready();
        return app;
    } catch (error) {
        await app.close();
        throw error;
    }
}
