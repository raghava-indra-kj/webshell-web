# Adding persistence

The initial foundation has no database driver, ORM, connection configuration, or migrations. MySQL can be the first integration without changing domain behavior.

## Integration work

1. Choose the MySQL driver or ORM based on concrete query and transaction requirements, and verify supported Node/MySQL versions.
2. Define validated connection configuration. Keep credentials outside source control and public diagnostics.
3. Add connection/pool setup under `src/infra/database` and register cleanup during application shutdown.
4. Implement the application-owned repository under the module's `infra` boundary. Map SQL records to domain snapshots explicitly.
5. Add reviewed, version-controlled migrations and a separate migration deployment command. Avoid running migrations automatically in every application replica.
6. Wire the persistent implementation into `create-dependencies.ts`; register the real business module independently of the development-only example flag.
7. Extend readiness to check the database if it is required for serving requests.
8. Run integration tests against a real MySQL test database with isolated data and deterministic cleanup.

## Required repository semantics

- Enforce unique identifiers through database constraints.
- Match `expectedVersion` in the update condition and advance the version in the same atomic statement.
- Inspect affected-row counts to distinguish a successful update from a stale/missing record.
- Translate known constraint/concurrency outcomes into typed application failures.
- Propagate unexpected connectivity or query failures to centralized error handling.
- Keep SQL types, connections, and ORM records outside domain/application contracts.

When a use case requires multiple writes to succeed together, introduce a transaction boundary appropriate to the selected library. Every participating operation must use the same transaction context. Do not treat a series of independently committed repository calls as a transaction.

Add durable idempotency or a transactional outbox only when real requirements need retry-safe external effects. Database independence does not imply automatic portability of migrations, SQL semantics, or transactions.
