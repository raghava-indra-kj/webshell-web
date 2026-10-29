import { onTestFinished } from 'vitest';
import { createApp } from '../app/create-app.js';
import type { AppDependencies } from '../app/create-dependencies.js';
import { parseEnv } from '../infra/config/env.js';

export async function createTestApp(
    options: {
        env?: Record<string, unknown>;
        dependencies?: AppDependencies;
    } = {},
) {
    const env = parseEnv({
        NODE_ENV: 'test',
        LOG_LEVEL: 'silent',
        API_DOCS_ENABLED: 'false',
        ...options.env,
    });
    const app = await createApp({
        env,
        ...(options.dependencies ? { dependencies: options.dependencies } : {}),
    });
    onTestFinished(() => app.close());
    return app;
}
