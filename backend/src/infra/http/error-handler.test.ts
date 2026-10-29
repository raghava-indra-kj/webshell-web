import { expect, it } from 'vitest';
import { createTestApp } from '../../test/create-test-app.js';
import type { ProjectRepository } from '../../modules/projects/application/project.repository.js';

it('sanitizes unexpected errors and generates its own correlation ID', async () => {
    const secret = 'password=internal-secret';
    const fail = async () => {
        throw new Error(secret);
    };
    const repository: ProjectRepository = { insert: fail, findById: fail, update: fail };
    const app = await createTestApp({
        dependencies: {
            projects: { repository, generateId: () => '00000000-0000-4000-8000-000000000001' },
        },
    });
    const response = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { 'x-request-id': 'untrusted-caller-id' },
        payload: { name: 'Name' },
    });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain(secret);
    expect(response.body).not.toContain('stack');
    expect(response.json()).toMatchObject({
        code: 'INTERNAL_ERROR',
        requestId: response.headers['x-request-id'],
    });
    expect(response.headers['x-request-id']).not.toBe('untrusted-caller-id');
});

it('returns consistent unknown-route and malformed-JSON errors', async () => {
    const app = await createTestApp();
    expect((await app.inject('/missing')).json()).toMatchObject({
        status: 404,
        code: 'ROUTE_NOT_FOUND',
    });
    const response = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { 'content-type': 'application/json' },
        payload: '{"secret":bad-json}',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('bad-json');
    expect(response.headers['content-type']).toContain('application/problem+json');
});
