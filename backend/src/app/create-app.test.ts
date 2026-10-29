import { expect, it } from 'vitest';
import { createTestApp } from '../test/create-test-app.js';
import { parseEnv } from '../infra/config/env.js';
import { createApp } from './create-app.js';
import { createDependencies } from './create-dependencies.js';

it('does not open a port and isolates application state', async () => {
    const first = await createTestApp();
    const second = await createTestApp();
    expect(first.server.listening).toBe(false);
    const created = await first.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: { name: 'First app' },
    });
    expect((await second.inject(`/api/v1/projects/${created.json().id}`)).statusCode).toBe(404);
});

it('disables demo routes and docs by default in production', async () => {
    const app = await createTestApp({ env: { NODE_ENV: 'production' } });
    expect(
        (await app.inject('/api/v1/projects/00000000-0000-4000-8000-000000000001')).statusCode,
    ).toBe(404);
    expect((await app.inject('/docs/json')).statusCode).toBe(404);
    expect((await app.inject('/health/ready')).statusCode).toBe(200);
    const unsafe = { ...parseEnv({ NODE_ENV: 'production' }), exampleModuleEnabled: true };
    expect(() => createDependencies(unsafe)).toThrow('not permitted in production');
    await expect(createApp({ env: unsafe, dependencies: {} })).rejects.toThrow(
        'not permitted in production',
    );
});

it('requires dependencies for explicitly enabled modules', async () => {
    await expect(
        createApp({ env: parseEnv({ NODE_ENV: 'test' }), dependencies: {} }),
    ).rejects.toThrow('Projects dependencies are required');
});

it('only advertises configured CORS origins and applies security headers', async () => {
    const app = await createTestApp({ env: { CORS_ORIGINS: 'https://allowed.example' } });
    const allowed = await app.inject({
        url: '/health/live',
        headers: { origin: 'https://allowed.example' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example');
    expect(allowed.headers['x-content-type-options']).toBe('nosniff');
    const denied = await app.inject({
        url: '/health/live',
        headers: { origin: 'https://other.example' },
    });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
});

it('enforces request-size and rate limits without rate-limiting health checks', async () => {
    const app = await createTestApp();
    const large = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: { name: 'x'.repeat(1024 * 1024) },
    });
    expect(large.statusCode).toBe(413);
    let status = 0;
    for (let i = 0; i < 101; i++) {
        status = (await app.inject('/api/v1/projects/not-a-uuid')).statusCode;
    }
    expect(status).toBe(429);
    expect((await app.inject('/health/live')).statusCode).toBe(200);
});
