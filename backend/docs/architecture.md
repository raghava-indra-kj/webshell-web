# Architecture

The application is a modular monolith: one process, with business capabilities owning their rules, use cases, contracts, adapters, and HTTP endpoints.

## Boundaries

| Boundary             | Responsibility                             | Dependencies                                |
| -------------------- | ------------------------------------------ | ------------------------------------------- |
| `core`               | Small universal result and exception types | Own core code only                          |
| Module `domain`      | Entities, invariants, state transitions    | Own domain and core                         |
| Module `application` | Use cases and required ports               | Own application, domain, and core           |
| Module `infra`       | Concrete port implementations              | Contracts, domain, core, external libraries |
| Module `api`         | Validation, handlers, public mappings      | Use cases, schemas, shared HTTP helpers     |
| `*.module.ts`        | Module assembly and registration           | Module components                           |
| `app` and `main.ts`  | Application composition and lifecycle      | Components needed for assembly              |

Run `pnpm architecture:check` locally to validate domain and application dependencies, cycles, shared infrastructure ownership, module-private imports, and transport/storage boundaries. Tests are excluded from production boundary checks and may exercise concrete adapters.

Cross-module implementation imports are rejected. Introduce a deliberate published application contract before implementing cross-module collaboration, and update the boundary rules explicitly. Shared infrastructure cannot import business modules. Modules cannot import application bootstrap code.

## Business behavior

Use cases accept plain input, call domain operations, and coordinate required ports. They do not receive Fastify requests or replies. Domain invariants apply even when a use case is called from a future worker or CLI. Zod validates external shape; it is not the sole enforcement point for business rules.

The example uses immutable snapshots. It does not introduce base entities, generic CRUD services, an event bus, a mediator, or a dependency injection container. Add patterns when actual requirements justify them.

## Results and errors

Expected failures use the local `Result` discriminated union. Domain errors represent rule failures. Application-level errors represent missing records or conflicts. Only the API layer maps these to HTTP statuses.

Unexpected exceptions propagate to the central handler, which preserves internal causes for logging and sends a sanitized 500 response. Do not attach HTTP codes to domain errors or return raw database/provider messages.

## Persistence and concurrency

Application-owned repositories express actual use-case requirements. The Projects contract requires unique inserts and atomic expected-version updates. An update must write the next version only if the stored version still matches the expected version. Missing or stale updates must not silently create records.

The in-memory adapter is scoped to one application instance and copies snapshots at its boundary. Its contract tests do not establish the behavior of a future SQL adapter; that adapter needs real database integration tests.

## Composition and runtime

`main.ts` owns environment loading through the Node entry command, listening, process signals, and shutdown deadlines. `create-app.ts` configures a testable application without listening. `create-dependencies.ts` selects concrete dependencies. Module entry points create use cases and register their routes.

Use `.js` extensions in relative TypeScript imports under NodeNext. The production build excludes test files and test helpers, and runs as ordinary Node ESM JavaScript.
