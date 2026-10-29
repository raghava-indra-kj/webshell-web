import type { Result } from '../../../core/fp/result.js';
import type { Project } from '../domain/project.js';

export type ProjectConflict = { readonly code: 'PROJECT_CONFLICT'; readonly message: string };

/** Implementations must atomically enforce unique IDs and expected versions. */
export interface ProjectRepository {
    insert(project: Project): Promise<Result<void, ProjectConflict>>;
    findById(id: string): Promise<Project | null>;
    update(project: Project, expectedVersion: number): Promise<Result<void, ProjectConflict>>;
}
