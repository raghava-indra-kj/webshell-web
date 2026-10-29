import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('environment configuration', () => {
    it('applies development defaults and production-safe defaults', () => {
        expect(parseEnv({})).toMatchObject({
            nodeEnv: 'development',
            port: 3000,
            exampleModuleEnabled: true,
            apiDocsEnabled: true,
        });
        expect(parseEnv({ NODE_ENV: 'production' })).toMatchObject({
            exampleModuleEnabled: false,
            apiDocsEnabled: false,
        });
    });
    it.each([
        { PORT: '0' },
        { PORT: '70000' },
        { PORT: 'abc' },
        { API_DOCS_ENABLED: 'yes' },
        { NODE_ENV: 'staging' },
    ])('rejects invalid input: %j', (input) => {
        expect(() => parseEnv(input)).toThrow('Invalid application configuration');
    });
    it('parses explicit false values and empty optional flags', () => {
        expect(
            parseEnv({ API_DOCS_ENABLED: 'false', EXAMPLE_MODULE_ENABLED: 'false' }),
        ).toMatchObject({ apiDocsEnabled: false, exampleModuleEnabled: false });
        expect(parseEnv({ API_DOCS_ENABLED: '', EXAMPLE_MODULE_ENABLED: '' })).toMatchObject({
            apiDocsEnabled: true,
            exampleModuleEnabled: true,
        });
    });
    it('accepts only explicit HTTP origins', () => {
        expect(
            parseEnv({ CORS_ORIGINS: 'https://example.com, http://localhost:5173' }).corsOrigins,
        ).toEqual(['https://example.com', 'http://localhost:5173']);
        for (const origin of [
            '*',
            'https://example.com/path',
            'https://user:password@example.com',
            'ftp://example.com',
        ]) {
            expect(() => parseEnv({ CORS_ORIGINS: origin })).toThrow('CORS_ORIGINS');
        }
    });
    it('rejects in-memory storage in production', () => {
        expect(() => parseEnv({ NODE_ENV: 'production', EXAMPLE_MODULE_ENABLED: 'true' })).toThrow(
            'not permitted in production',
        );
    });
});
