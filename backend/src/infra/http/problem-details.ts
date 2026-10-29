import { STATUS_CODES } from 'node:http';
import { z } from 'zod';

export const problemDetailsSchema = z.object({
    type: z.literal('about:blank'),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    code: z.string(),
    requestId: z.string(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export function createProblem(input: {
    status: number;
    code: string;
    detail: string;
    requestId: string;
    errors?: ProblemDetails['errors'];
}): ProblemDetails {
    return { type: 'about:blank', title: STATUS_CODES[input.status] ?? 'Error', ...input };
}
