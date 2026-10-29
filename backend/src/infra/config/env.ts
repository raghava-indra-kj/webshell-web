import { z } from 'zod';

const optionalBoolean = z.preprocess(
    (value) =>
        value === '' || value === undefined
            ? undefined
            : value === 'true'
              ? true
              : value === 'false'
                ? false
                : value,
    z.boolean().optional(),
);

const schema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        APP_NAME: z.string().trim().min(1).max(80).default('node-foundation'),
        HOST: z.string().trim().min(1).default('127.0.0.1'),
        PORT: z.coerce.number().int().min(1).max(65535).default(3000),
        LOG_LEVEL: z
            .enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'])
            .default('info'),
        CORS_ORIGINS: z
            .string()
            .default('')
            .transform((value) =>
                value
                    .split(',')
                    .map((origin) => origin.trim())
                    .filter(Boolean),
            )
            .refine(
                (origins) =>
                    origins.every((origin) => {
                        try {
                            const url = new URL(origin);
                            return (
                                ['http:', 'https:'].includes(url.protocol) && url.origin === origin
                            );
                        } catch {
                            return false;
                        }
                    }),
                'CORS_ORIGINS must contain comma-separated HTTP(S) origins without paths or trailing slashes.',
            ),
        API_DOCS_ENABLED: optionalBoolean,
        EXAMPLE_MODULE_ENABLED: optionalBoolean,
    })
    .transform((input) => ({
        nodeEnv: input.NODE_ENV,
        appName: input.APP_NAME,
        host: input.HOST,
        port: input.PORT,
        logLevel: input.LOG_LEVEL,
        corsOrigins: input.CORS_ORIGINS,
        apiDocsEnabled: input.API_DOCS_ENABLED ?? input.NODE_ENV !== 'production',
        exampleModuleEnabled: input.EXAMPLE_MODULE_ENABLED ?? input.NODE_ENV !== 'production',
    }))
    .superRefine((env, context) => {
        if (env.nodeEnv === 'production' && env.exampleModuleEnabled) {
            context.addIssue({
                code: 'custom',
                path: ['EXAMPLE_MODULE_ENABLED'],
                message: 'In-memory example storage is not permitted in production.',
            });
        }
    });

export type Env = z.infer<typeof schema>;

export function parseEnv(input: Record<string, unknown> = process.env): Env {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
        // Only paths and diagnostics are exposed, never the supplied values.
        const diagnostics = parsed.error.issues.map(
            (issue) => `${issue.path.join('.')}: ${issue.message}`,
        );
        throw new Error(`Invalid application configuration:\n${diagnostics.join('\n')}`);
    }
    return parsed.data;
}
