type AppErrorParams = ErrorOptions & { message: string; code?: string };

/** Represents an application error with an optional code and underlying cause. */
export class AppError extends Error {
    readonly code?: string;

    constructor({ message, code, cause }: AppErrorParams) {
        super(message, { cause });
        this.name = 'AppError';
        this.code = code;
    }
}
