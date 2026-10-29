import { z } from 'zod';
import { ApiError, ApiErrorKind } from './api-error';

/** Validates an API response against the supplied schema and returns typed data. */
export function parseApiResponse<TSchema extends z.ZodType>(
    data: unknown,
    schema: TSchema,
    service: string,
): z.output<TSchema> {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new ApiError({ kind: ApiErrorKind.InvalidResponse, service, cause: result.error });
    }

    return result.data;
}
