import { describe, expect, it } from 'vitest';
import { archiveProject, createProject } from './project.js';

describe('project domain', () => {
    it('normalizes a valid name and creates immutable active state', () => {
        const result = createProject({ id: 'project-1', name: '  Foundation  ' });
        expect(result).toEqual({
            ok: true,
            data: { id: 'project-1', name: 'Foundation', status: 'active', version: 1 },
        });
        if (result.ok) expect(Object.isFrozen(result.data)).toBe(true);
    });
    it.each(['', '   ', 'x'.repeat(121)])(
        'rejects invalid names without an HTTP validator',
        (name) => {
            expect(createProject({ id: 'project-1', name })).toMatchObject({
                ok: false,
                error: { code: 'INVALID_PROJECT_NAME' },
            });
        },
    );
    it('archives a project without changing the previous snapshot', () => {
        const original = createProject({ id: 'project-1', name: 'Foundation' });
        if (!original.ok) throw new Error('Invalid test fixture');
        const archived = archiveProject(original.data);
        expect(archived).toMatchObject({ ok: true, data: { status: 'archived', version: 2 } });
        expect(original.data.status).toBe('active');
        if (!archived.ok) throw new Error('Invalid test fixture');
        expect(archiveProject(archived.data)).toMatchObject({
            ok: false,
            error: { code: 'PROJECT_ALREADY_ARCHIVED' },
        });
    });
});
