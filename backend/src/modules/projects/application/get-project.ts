import { resultErr, resultOk } from '../../../core/fp/result.js';
import type { ProjectRepository } from './project.repository.js';

export type ProjectNotFound = { readonly code: 'PROJECT_NOT_FOUND'; readonly message: string };

export function makeGetProject(repository: ProjectRepository) {
    return async (id: string) => {
        const project = await repository.findById(id);
        if (!project) {
            return resultErr<ProjectNotFound>({
                code: 'PROJECT_NOT_FOUND',
                message: 'Project was not found.',
            });
        }
        return resultOk(project);
    };
}

export type GetProject = ReturnType<typeof makeGetProject>;
