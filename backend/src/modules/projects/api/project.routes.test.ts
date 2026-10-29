import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../../test/create-test-app.js';

describe('projects API', () => {
    it('creates, retrieves, archives, and rejects repeated archiving', async () => {
        const app = await createTestApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/v1/projects',
            payload: { name: ' Foundation ' },
        });
        expect(created.statusCode).toBe(201);
        const project = created.json();
        expect(project).toEqual({
            id: expect.any(String),
            name: 'Foundation',
            status: 'active',
            version: 1,
        });
        expect(created.headers.location).toBe(`/api/v1/projects/${project.id}`);
        const retrieved = await app.inject({
            method: 'GET',
            url: `/api/v1/projects/${project.id}`,
        });
        expect(retrieved.json()).toEqual(project);
        const archived = await app.inject({
            method: 'PATCH',
            url: `/api/v1/projects/${project.id}/archive`,
        });
        expect(archived.statusCode).toBe(200);
        expect(archived.json()).toEqual({ ...project, status: 'archived', version: 2 });
        const repeated = await app.inject({
            method: 'PATCH',
            url: `/api/v1/projects/${project.id}/archive`,
        });
        expect(repeated.statusCode).toBe(409);
        expect(repeated.json()).toMatchObject({
            status: 409,
            code: 'PROJECT_ALREADY_ARCHIVED',
            requestId: repeated.headers['x-request-id'],
        });
        expect(repeated.headers['content-type']).toContain('application/problem+json');
    });
    it('validates bodies and IDs and maps missing records', async () => {
        const app = await createTestApp();
        for (const payload of [
            { name: ' ' },
            { name: 'x'.repeat(121) },
            { name: 'Name', status: 'archived' },
        ]) {
            expect(
                (await app.inject({ method: 'POST', url: '/api/v1/projects', payload })).statusCode,
            ).toBe(400);
        }
        expect((await app.inject('/api/v1/projects/invalid-id')).statusCode).toBe(400);
        const missing = await app.inject('/api/v1/projects/00000000-0000-4000-8000-000000000001');
        expect(missing.statusCode).toBe(404);
        expect(missing.json().code).toBe('PROJECT_NOT_FOUND');
    });
    it('publishes the routes and response schemas in OpenAPI', async () => {
        const app = await createTestApp({ env: { API_DOCS_ENABLED: 'true' } });
        const response = await app.inject('/docs/json');
        expect(response.statusCode).toBe(200);
        const spec = response.json();
        expect(spec.paths['/api/v1/projects'].post.responses['201']).toBeDefined();
        expect(spec.paths['/api/v1/projects/{id}'].get.responses['404']).toBeDefined();
        expect(spec.paths['/api/v1/projects/{id}/archive'].patch.responses['409']).toBeDefined();
        expect((await app.inject('/docs/')).statusCode).toBe(200);
    });
});
