import { createApp } from './app/create-app.js';
import { createDependencies } from './app/create-dependencies.js';
import { parseEnv } from './infra/config/env.js';

try {
    const env = parseEnv();
    const app = await createApp({ env, dependencies: createDependencies(env) });
    let closing = false;
    const shutdown = async (signal: string) => {
        if (closing) return;
        closing = true;
        app.log.info({ signal }, 'Stopping application');
        const deadline = setTimeout(() => {
            app.log.fatal('Shutdown deadline exceeded');
            process.exit(1);
        }, 10_000);
        deadline.unref();
        try {
            await app.close();
        } catch (error) {
            app.log.error({ err: error }, 'Shutdown failed');
            process.exitCode = 1;
        } finally {
            clearTimeout(deadline);
        }
    };
    process.once('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
    process.once('SIGINT', () => {
        void shutdown('SIGINT');
    });
    try {
        await app.listen({ host: env.host, port: env.port });
    } catch (error) {
        app.log.error({ err: error }, 'Startup failed');
        await app.close();
        process.exitCode = 1;
    }
} catch (error) {
    // Configuration validation contains field names and safe diagnostics, not raw values.
    console.error(error instanceof Error ? error.message : 'Application startup failed');
    process.exitCode = 1;
}
