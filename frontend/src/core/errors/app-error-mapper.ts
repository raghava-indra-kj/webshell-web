import { AppError } from './app-error';

/**
 * Converts an unknown error into an AppError while preserving the original cause.
 * Existing AppError instances are returned unchanged.
 */
export function mapToAppError({ error }: { error: unknown }): AppError {
    if (error instanceof AppError) {
        return error;
    }

    let message = 'Unexpected error';

    if (error instanceof Error && error.message.trim()) {
        message = error.message.trim();
    } else if (typeof error === 'string' && error.trim()) {
        message = error.trim();
    }

    return new AppError({ message, cause: error });
}
