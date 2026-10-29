import { expect, it } from 'vitest';
import { createTestApp } from '../../test/create-test-app.js';

it('reports liveness and completed startup without a database', async () => {
    const app = await createTestApp();
    const live = await app.inject('/health/live');
    const ready = await app.inject('/health/ready');
    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({ status: 'ok' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: 'ready' });
    await app.close();
    expect(app.server.listening).toBe(false);
});
