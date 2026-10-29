import { describe, expect, it } from 'vitest';
import { createInMemoryProjectRepository } from './in-memory-project.repository.js';
import type { Project } from '../domain/project.js';

describe('in-memory repository contract', () => {
    const project: Project = { id: 'project-1', name: 'Foundation', status: 'active', version: 1 };
    it('enforces unique IDs and returns null for missing records', async () => {
        const repo = createInMemoryProjectRepository();
        expect(await repo.findById('missing')).toBeNull();
        expect(await repo.insert(project)).toMatchObject({ ok: true });
        expect(await repo.insert(project)).toMatchObject({
            ok: false,
            error: { code: 'PROJECT_CONFLICT' },
        });
    });
    it('defensively copies input and output state', async () => {
        const repo = createInMemoryProjectRepository();
        const input = { ...project };
        await repo.insert(input);
        input.name = 'Changed outside repository';
        const first = await repo.findById(project.id);
        const second = await repo.findById(project.id);
        expect(first?.name).toBe('Foundation');
        expect(first).not.toBe(second);
        expect(Object.isFrozen(first)).toBe(true);
    });
    it('accepts one of two competing updates and rejects stale writes', async () => {
        const repo = createInMemoryProjectRepository();
        await repo.insert(project);
        const next: Project = { ...project, status: 'archived', version: 2 };
        const outcomes = await Promise.all([repo.update(next, 1), repo.update(next, 1)]);
        expect(outcomes.filter((result) => result.ok)).toHaveLength(1);
        expect(outcomes.filter((result) => !result.ok)).toHaveLength(1);
        expect(await repo.findById(project.id)).toEqual(next);
    });
    it('does not upsert missing records or accept invalid version transitions', async () => {
        const repo = createInMemoryProjectRepository();
        expect(await repo.update({ ...project, version: 2 }, 1)).toMatchObject({ ok: false });
        await repo.insert(project);
        expect(await repo.update({ ...project, version: 4 }, 1)).toMatchObject({ ok: false });
        expect((await repo.findById(project.id))?.version).toBe(1);
    });
});
