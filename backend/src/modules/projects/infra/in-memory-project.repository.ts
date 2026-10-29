import { resultErr, resultOk } from '../../../core/fp/result.js';
import type { Project } from '../domain/project.js';
import type { ProjectConflict, ProjectRepository } from '../application/project.repository.js';

export function createInMemoryProjectRepository(): ProjectRepository {
    const projects = new Map<string, Project>();
    const conflict = () =>
        resultErr<ProjectConflict>({
            code: 'PROJECT_CONFLICT',
            message: 'Project changed or already exists. Retrieve its latest state and try again.',
        });

    return {
        async insert(project) {
            if (projects.has(project.id)) return conflict();
            projects.set(project.id, Object.freeze({ ...project }));
            return resultOk(undefined);
        },
        async findById(id) {
            const project = projects.get(id);
            return project ? Object.freeze({ ...project }) : null;
        },
        async update(project, expectedVersion) {
            const existing = projects.get(project.id);
            if (
                !existing ||
                existing.version !== expectedVersion ||
                project.version !== expectedVersion + 1
            ) {
                return conflict();
            }
            projects.set(project.id, Object.freeze({ ...project }));
            return resultOk(undefined);
        },
    };
}
