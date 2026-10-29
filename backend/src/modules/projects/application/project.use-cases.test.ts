import { describe, expect, it, vi } from 'vitest';
import { resultErr, resultOk } from '../../../core/fp/result.js';
import type { Project } from '../domain/project.js';
import type { ProjectRepository } from './project.repository.js';
import { makeCreateProject } from './create-project.js';
import { makeGetProject } from './get-project.js';
import { makeArchiveProject } from './archive-project.js';

const project: Project = { id: 'project-1', name: 'Foundation', status: 'active', version: 1 };
const conflict = { code: 'PROJECT_CONFLICT', message: 'Conflicting write' } as const;
function repository(overrides: Partial<ProjectRepository> = {}): ProjectRepository {
    return {
        insert: vi.fn(async () => resultOk(undefined)),
        findById: vi.fn(async () => null),
        update: vi.fn(async () => resultOk(undefined)),
        ...overrides,
    };
}

describe('project use cases', () => {
    it('uses injected IDs and persists domain-validated state', async () => {
        const repo = repository();
        const create = makeCreateProject({ repository: repo, generateId: () => 'project-1' });
        expect(await create({ name: ' Foundation ' })).toEqual(resultOk(project));
        expect(repo.insert).toHaveBeenCalledWith(project);
    });
    it('does not write when domain validation fails', async () => {
        const repo = repository();
        expect(
            await makeCreateProject({ repository: repo, generateId: () => 'id' })({ name: ' ' }),
        ).toMatchObject({ ok: false });
        expect(repo.insert).not.toHaveBeenCalled();
    });
    it('reports missing projects for retrieval and archiving', async () => {
        const repo = repository();
        expect(await makeGetProject(repo)('missing')).toMatchObject({
            ok: false,
            error: { code: 'PROJECT_NOT_FOUND' },
        });
        expect(await makeArchiveProject(repo)('missing')).toMatchObject({
            ok: false,
            error: { code: 'PROJECT_NOT_FOUND' },
        });
        expect(repo.update).not.toHaveBeenCalled();
    });
    it('passes the original version to persistence and preserves conflicts', async () => {
        const repo = repository({
            findById: vi.fn(async () => project),
            update: vi.fn(async () => resultErr(conflict)),
        });
        expect(await makeArchiveProject(repo)(project.id)).toEqual(resultErr(conflict));
        expect(repo.update).toHaveBeenCalledWith({ ...project, status: 'archived', version: 2 }, 1);
    });
    it('preserves insert conflicts and propagates unexpected storage failures', async () => {
        const repo = repository({ insert: vi.fn(async () => resultErr(conflict)) });
        expect(
            await makeCreateProject({ repository: repo, generateId: () => 'id' })({ name: 'Name' }),
        ).toEqual(resultErr(conflict));
        const failure = new Error('Storage unavailable');
        const broken = repository({
            findById: vi.fn(async () => {
                throw failure;
            }),
        });
        await expect(makeGetProject(broken)('id')).rejects.toBe(failure);
    });
});
