export type Result<TData, TError> =
    { readonly ok: true; readonly data: TData } | { readonly ok: false; readonly error: TError };

export function resultOk<TData>(data: TData): Result<TData, never> {
    return { ok: true, data };
}

export function resultErr<TError>(error: TError): Result<never, TError> {
    return { ok: false, error };
}
