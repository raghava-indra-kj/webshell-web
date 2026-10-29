export type ProjectError =
    | { readonly code: 'INVALID_PROJECT_NAME'; readonly message: string }
    | { readonly code: 'PROJECT_ALREADY_ARCHIVED'; readonly message: string };
