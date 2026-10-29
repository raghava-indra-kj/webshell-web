import { AppError } from './app-error.js';

export function mapToAppError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    return new AppError({
        message: error instanceof Error ? error.message : 'Unexpected application failure',
        cause: error,
    });
}
