import { z } from 'zod';
import { problemDetailsSchema } from '../../../infra/http/problem-details.js';

export const projectParamsSchema = z.object({ id: z.uuid() });
export const createProjectSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export const projectSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    status: z.enum(['active', 'archived']),
    version: z.number().int().positive(),
});
export const projectErrorResponses = {
    400: problemDetailsSchema,
    404: problemDetailsSchema,
    409: problemDetailsSchema,
    429: problemDetailsSchema,
    500: problemDetailsSchema,
};
