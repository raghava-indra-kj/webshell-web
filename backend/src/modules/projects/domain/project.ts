import { resultErr, resultOk, type Result } from '../../../core/fp/result.js';
import type { ProjectError } from './project-error.js';

export type Project = Readonly<{
    id: string;
    name: string;
    status: 'active' | 'archived';
    version: number;
}>;

export function createProject(input: { id: string; name: string }): Result<Project, ProjectError> {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 120) {
        return resultErr({
            code: 'INVALID_PROJECT_NAME',
            message: 'Project name must contain between 1 and 120 characters.',
        });
    }
    return resultOk(Object.freeze({ id: input.id, name, status: 'active', version: 1 }));
}

export function archiveProject(project: Project): Result<Project, ProjectError> {
    if (project.status === 'archived') {
        return resultErr({
            code: 'PROJECT_ALREADY_ARCHIVED',
            message: 'Project is already archived.',
        });
    }
    return resultOk(
        Object.freeze({ ...project, status: 'archived', version: project.version + 1 }),
    );
}
