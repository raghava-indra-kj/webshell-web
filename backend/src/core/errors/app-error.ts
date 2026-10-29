type AppErrorOptions = ErrorOptions & { message: string; code?: string };

export class AppError extends Error {
    readonly code: string;

    constructor({ message, code = 'UNEXPECTED_ERROR', cause }: AppErrorOptions) {
        super(message, { cause });
        this.name = 'AppError';
        this.code = code;
    }
}
