/** Identifies the lifecycle status of an asynchronous operation. */
export const AsyncStatus = { Idle: 'idle', Loading: 'loading', Success: 'success', Error: 'error' } as const;

/**
 * Represents the mutually exclusive states of an asynchronous operation.
 * The error type defaults to unknown unless explicitly specified.
 */
export type AsyncState<TData, TError = unknown> =
    | { readonly status: typeof AsyncStatus.Idle }
    | { readonly status: typeof AsyncStatus.Loading }
    | { readonly status: typeof AsyncStatus.Success; readonly data: TData }
    | { readonly status: typeof AsyncStatus.Error; readonly error: TError };

/** Creates the initial state of an asynchronous operation. */
export function createAsyncIdleState() {
    return { status: AsyncStatus.Idle } as const;
}

/** Creates the state of an operation in progress. */
export function createAsyncLoadingState() {
    return { status: AsyncStatus.Loading } as const;
}

/** Creates a successful state containing the operation result. */
export function createAsyncSuccessState<TData>(data: TData) {
    return { status: AsyncStatus.Success, data } as const;
}

/** Creates a failed state while preserving the supplied error type. */
export function createAsyncErrorState<TError>(error: TError) {
    return { status: AsyncStatus.Error, error } as const;
}
