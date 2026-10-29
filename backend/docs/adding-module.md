# Adding a module

1. Name the business capability and define its operations and invariants.
2. Add `src/modules/<name>/domain` with plain entities and typed rule failures where business behavior needs them.
3. Add application use cases accepting plain inputs. Define only the ports those operations actually require.
4. Implement adapters under the module's `infra` boundary. Keep external models and SDK clients out of domain/application types.
5. Define Zod request/response schemas and explicit DTO/error mapping under `api`.
6. Add a `<name>.module.ts` registration entry point and wire concrete dependencies in `src/app/create-dependencies.ts`.
7. Register the module in `src/app/create-app.ts`, normally under `/api/v1`.
8. Add tests for domain rules, use-case outcomes, adapter behavior, and HTTP contracts. Run all documented checks.

Register global HTTP infrastructure before module routes. Module handlers should call a use case and map the result. Avoid passing request/reply objects into use cases or exporting persistence models to clients.

## Tests

Use `src/test/create-test-app.ts` from Vitest tests to create isolated applications with automatic cleanup. Inject controlled ports and identifier generation where needed. HTTP injection exercises schemas and handlers without opening ports.

When adding required external resources, extend readiness checks and register lifecycle cleanup. Do not report a service as ready when its required dependencies cannot serve requests.

## Removing the Projects example

Remove its registration/import from `create-app.ts`, its dependency construction/types from `create-dependencies.ts`, and tests specifically exercising Projects. Delete `src/modules/projects` after confirming those references are gone. Remove the example flag and its production guard from configuration once no longer used. Shared HTTP/config tests should then target the real module or a controlled test fixture.

The example is intentionally available only in development/test. Authentication and resource-level authorization must be designed for real business endpoints before exposing them to users.
