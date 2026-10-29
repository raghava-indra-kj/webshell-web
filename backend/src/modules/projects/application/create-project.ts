import { createProject } from '../domain/project.js';
import { resultOk } from '../../../core/fp/result.js';
import type { ProjectRepository } from './project.repository.js';

export function makeCreateProject(dependencies: {
    repository: ProjectRepository;
    generateId: () => string;
}) {
    return async (input: { name: string }) => {
        const project = createProject({ id: dependencies.generateId(), name: input.name });
        if (!project.ok) return project;
        const inserted = await dependencies.repository.insert(project.data);
        if (!inserted.ok) return inserted;
        return resultOk(project.data);
    };
}

export type CreateProject = ReturnType<typeof makeCreateProject>;
