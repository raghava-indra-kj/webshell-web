import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { CreateProject } from '../application/create-project.js';
import type { GetProject } from '../application/get-project.js';
import type { ArchiveProject } from '../application/archive-project.js';
import {
    createProjectSchema,
    projectErrorResponses,
    projectParamsSchema,
    projectSchema,
} from './project.schemas.js';
import { presentProject, presentProjectError } from './project.presenter.js';

export function registerProjectRoutes(
    app: FastifyInstance,
    useCases: {
        createProject: CreateProject;
        getProject: GetProject;
        archiveProject: ArchiveProject;
    },
): void {
    const server = app.withTypeProvider<ZodTypeProvider>();
    server.post(
        '/projects',
        {
            schema: {
                tags: ['projects'],
                body: createProjectSchema,
                response: { 201: projectSchema, ...projectErrorResponses },
            },
        },
        async (request, reply) => {
            const result = await useCases.createProject(request.body);
            if (!result.ok) {
                const failure = presentProjectError(result.error, request.id);
                return reply
                    .code(failure.status)
                    .type('application/problem+json')
                    .send(failure.body);
            }
            return reply
                .code(201)
                .header('location', `/api/v1/projects/${result.data.id}`)
                .send(presentProject(result.data));
        },
    );
    server.get(
        '/projects/:id',
        {
            schema: {
                tags: ['projects'],
                params: projectParamsSchema,
                response: { 200: projectSchema, ...projectErrorResponses },
            },
        },
        async (request, reply) => {
            const result = await useCases.getProject(request.params.id);
            if (!result.ok) {
                const failure = presentProjectError(result.error, request.id);
                return reply
                    .code(failure.status)
                    .type('application/problem+json')
                    .send(failure.body);
            }
            return reply.send(presentProject(result.data));
        },
    );
    server.patch(
        '/projects/:id/archive',
        {
            schema: {
                tags: ['projects'],
                params: projectParamsSchema,
                response: { 200: projectSchema, ...projectErrorResponses },
            },
        },
        async (request, reply) => {
            const result = await useCases.archiveProject(request.params.id);
            if (!result.ok) {
                const failure = presentProjectError(result.error, request.id);
                return reply
                    .code(failure.status)
                    .type('application/problem+json')
                    .send(failure.body);
            }
            return reply.send(presentProject(result.data));
        },
    );
}
