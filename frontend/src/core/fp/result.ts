/** Represents either a successful result or an expected failure. */
export type Result<TData, TError> =
    { readonly ok: true; readonly data: TData } | { readonly ok: false; readonly error: TError };

/** Creates a successful result containing data. */
export function resultOk<TData>(data: TData): Result<TData, never> {
    return { ok: true, data };
}

/** Creates a failed result containing an error. */
export function resultErr<TError>(error: TError): Result<never, TError> {
    return { ok: false, error };
}
