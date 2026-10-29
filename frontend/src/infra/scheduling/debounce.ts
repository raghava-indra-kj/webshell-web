/**
 * A debounced function with controls for cancellation and pending execution.
 */
export interface DebouncedFunction<TArgs extends unknown[]> {
    (...args: TArgs): void;

    /** Cancels a scheduled invocation. */
    cancel(): void;

    /** Indicates whether an invocation is scheduled. */
    isPending(): boolean;
}

/**
 * Creates a trailing-edge debounced function.
 * Repeated calls reset the delay and retain the latest arguments.
 */
export function debounce<TArgs extends unknown[]>(
    fn: (...args: TArgs) => void,
    delayMs: number,
): DebouncedFunction<TArgs> {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
        throw new RangeError(`Invalid debounce delay: expected a finite non-negative number, received ${delayMs}`);
    }

    let timerId: ReturnType<typeof setTimeout> | undefined;

    const debounced = function (...args: TArgs): void {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }

        timerId = setTimeout(() => {
            timerId = undefined;
            fn(...args);
        }, delayMs);
    };

    debounced.cancel = function (): void {
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timerId = undefined;
        }
    };

    debounced.isPending = function (): boolean {
        return timerId !== undefined;
    };

    return debounced;
}
