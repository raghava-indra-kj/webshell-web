import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { initializeI18n } from './infra/i18n/instance';
import { AppRoutes } from './ui/app-routes';
import { createQueryClient } from './ui/query/query-client';
import './ui/styles/globals.css';

/** Initializes application infrastructure before rendering React. */
async function bootstrap(): Promise<void> {
    await initializeI18n();

    const queryClient = createQueryClient();

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <Suspense fallback={null}>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </Suspense>
            </QueryClientProvider>
        </StrictMode>,
    );
}

void bootstrap().catch((error: unknown) => {
    console.error('Application initialization failed.', error);

    const root = document.getElementById('root');

    if (root) {
        root.textContent = 'Unable to start application.';
    }
});
