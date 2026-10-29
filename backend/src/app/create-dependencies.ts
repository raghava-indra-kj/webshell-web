import { randomUUID } from 'node:crypto';
import type { Env } from '../infra/config/env.js';
import type { ProjectRepository } from '../modules/projects/application/project.repository.js';
import { createInMemoryProjectRepository } from '../modules/projects/infra/in-memory-project.repository.js';

export type AppDependencies = {
    projects?: { repository: ProjectRepository; generateId: () => string };
};

export function createDependencies(env: Env): AppDependencies {
    if (!env.exampleModuleEnabled) return {};
    if (env.nodeEnv === 'production') {
        throw new Error('In-memory example storage is not permitted in production.');
    }
    return { projects: { repository: createInMemoryProjectRepository(), generateId: randomUUID } };
}
