import type { Project } from '../domain/project.js';
import type { ProjectError } from '../domain/project-error.js';
import type { ProjectConflict } from '../application/project.repository.js';
import type { ProjectNotFound } from '../application/get-project.js';
import { createProblem } from '../../../infra/http/problem-details.js';

export function presentProject(project: Project) {
    return { id: project.id, name: project.name, status: project.status, version: project.version };
}

export function presentProjectError(
    error: ProjectError | ProjectConflict | ProjectNotFound,
    requestId: string,
) {
    const status =
        error.code === 'PROJECT_NOT_FOUND'
            ? 404
            : error.code === 'INVALID_PROJECT_NAME'
              ? 400
              : 409;
    return {
        status,
        body: createProblem({ status, code: error.code, detail: error.message, requestId }),
    };
}
