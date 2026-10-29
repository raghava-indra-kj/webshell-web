import { resultErr, resultOk } from '../../../core/fp/result.js';
import { archiveProject } from '../domain/project.js';
import type { ProjectRepository } from './project.repository.js';
import type { ProjectNotFound } from './get-project.js';

export function makeArchiveProject(repository: ProjectRepository) {
    return async (id: string) => {
        const existing = await repository.findById(id);
        if (!existing) {
            return resultErr<ProjectNotFound>({
                code: 'PROJECT_NOT_FOUND',
                message: 'Project was not found.',
            });
        }
        const archived = archiveProject(existing);
        if (!archived.ok) return archived;
        const updated = await repository.update(archived.data, existing.version);
        if (!updated.ok) return updated;
        return resultOk(archived.data);
    };
}

export type ArchiveProject = ReturnType<typeof makeArchiveProject>;
