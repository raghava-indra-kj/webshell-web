import type { FastifyServerOptions } from 'fastify';
import type { Env } from '../config/env.js';

export function createLoggerOptions(env: Env): NonNullable<FastifyServerOptions['logger']> {
    return {
        level: env.logLevel,
        base: { service: env.appName },
        redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
            censor: '[REDACTED]',
        },
        // Query strings may contain tokens. Never log bodies or raw URLs by default.
        serializers: {
            req(request: { method: string; url: string; hostname?: string }) {
                return { method: request.method, path: request.url.split('?')[0] };
            },
        },
    };
}
