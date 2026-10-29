module.exports = {
    forbidden: [
        { name: 'no-circular-imports', severity: 'error', from: {}, to: { circular: true } },
        {
            name: 'no-unresolved-imports',
            severity: 'error',
            from: {},
            to: { couldNotResolve: true },
        },
        {
            name: 'core-is-independent',
            severity: 'error',
            from: { path: '^src/core/' },
            to: { pathNot: '^src/core/' },
        },
        {
            name: 'domain-is-independent',
            severity: 'error',
            from: { path: '^src/modules/([^/]+)/domain/' },
            to: { pathNot: '^src/(core/|modules/$1/domain/)' },
        },
        {
            name: 'application-uses-domain-and-ports',
            severity: 'error',
            from: { path: '^src/modules/([^/]+)/application/' },
            to: { pathNot: '^src/(core/|modules/$1/(domain|application)/)' },
        },
        {
            name: 'module-internals-are-private',
            severity: 'error',
            from: { path: '^src/modules/([^/]+)/' },
            to: { path: '^src/modules/', pathNot: '^src/modules/$1/' },
        },
        {
            name: 'infrastructure-cannot-import-http-handlers',
            severity: 'error',
            from: { path: '^src/modules/[^/]+/infra/' },
            to: { path: '^src/modules/[^/]+/api/' },
        },
        {
            name: 'api-cannot-import-storage',
            severity: 'error',
            from: { path: '^src/modules/[^/]+/api/' },
            to: { path: '^src/modules/[^/]+/infra/' },
        },
        {
            name: 'shared-infrastructure-cannot-import-modules',
            severity: 'error',
            from: { path: '^src/infra/' },
            to: { path: '^src/modules/' },
        },
        {
            name: 'composition-is-an-entry-point',
            severity: 'error',
            from: { path: '^src/', pathNot: '^src/(app/|main\\.ts$)' },
            to: { path: '^src/(app/|main\\.ts$)' },
        },
        {
            name: 'production-cannot-import-test-helpers',
            severity: 'error',
            from: { path: '^src/' },
            to: { path: '\\.test\\.ts$|^src/test/' },
        },
    ],
    options: {
        tsConfig: { fileName: 'tsconfig.json' },
        tsPreCompilationDeps: true,
        doNotFollow: { path: 'node_modules' },
        exclude: { path: '\\.test\\.ts$|^src/test/' },
        enhancedResolveOptions: { conditionNames: ['import', 'node', 'default'] },
    },
};
