import type { FastifyInstance } from 'fastify';
import type { ProjectRepository } from './application/project.repository.js';
import { makeCreateProject } from './application/create-project.js';
import { makeGetProject } from './application/get-project.js';
import { makeArchiveProject } from './application/archive-project.js';
import { registerProjectRoutes } from './api/project.routes.js';

export async function registerProjects(
    app: FastifyInstance,
    dependencies: {
        repository: ProjectRepository;
        generateId: () => string;
    },
): Promise<void> {
    registerProjectRoutes(app, {
        createProject: makeCreateProject(dependencies),
        getProject: makeGetProject(dependencies.repository),
        archiveProject: makeArchiveProject(dependencies.repository),
    });
}
