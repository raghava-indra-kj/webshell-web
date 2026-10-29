# Node Foundation

A TypeScript / Fastify REST API starter with domain-driven module boundaries, Zod contracts, OpenAPI documentation, and a removable Projects example. It runs without a database or external services.

## Getting started

Use the Node version in `.nvmrc` and pnpm 10.18.3. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm setup:project "My API"
pnpm dev
```

The setup command changes the package name and example application name, and creates `env/.env`. An existing local environment file is preserved; update its `APP_NAME` yourself when renaming an existing project. The command also supports an interactive prompt.

By default the API listens on `http://127.0.0.1:3000`. Development documentation is at `/docs/`, and the OpenAPI document is at `/docs/json`. No frontend server is required.

## Commands

| Command                     | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| `pnpm setup:project [name]` | Initialize identity and local environment |
| `pnpm dev`                  | Run TypeScript with automatic restart     |
| `pnpm build`                | Compile application code into `dist/`     |
| `pnpm start`                | Run compiled JavaScript                   |
| `pnpm typecheck`            | Check application and test types          |
| `pnpm lint`                 | Lint source and scripts                   |
| `pnpm architecture:check`   | Check import boundaries and cycles        |
| `pnpm test`                 | Watch tests                               |
| `pnpm test:run`             | Run all tests once                        |
| `pnpm format`               | Format the project                        |
| `pnpm format:check`         | Check formatting                          |

Both start commands optionally load `env/.env` using Node's native environment-file support. Existing process environment variables take precedence. Deployment environments can supply configuration directly.

## Configuration

| Variable                 | Default                 | Meaning                                                            |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`               | `development`           | `development`, `test`, or `production`                             |
| `APP_NAME`               | `node-foundation`       | Log and documentation identity                                     |
| `HOST`                   | `127.0.0.1`             | Listening interface                                                |
| `PORT`                   | `3000`                  | Integer from 1 to 65535                                            |
| `LOG_LEVEL`              | `info`                  | Pino level, including `silent`                                     |
| `CORS_ORIGINS`           | empty                   | Comma-separated HTTP(S) origins, without paths or trailing slashes |
| `API_DOCS_ENABLED`       | true outside production | Accepts `true`, `false`, or empty for default                      |
| `EXAMPLE_MODULE_ENABLED` | true outside production | Accepts `true`, `false`, or empty for default                      |

Invalid configuration stops startup. In production, the example module and documentation are disabled by default. Enabling the in-memory example in production is rejected even when dependencies are injected manually. The production starter therefore exposes health endpoints until real business modules are added.

## Example API

| Method | Path                           | Result                                                                    |
| ------ | ------------------------------ | ------------------------------------------------------------------------- |
| POST   | `/api/v1/projects`             | Create from `{ "name": "My project" }`; returns 201 and a Location header |
| GET    | `/api/v1/projects/:id`         | Retrieve a project by UUID                                                |
| PATCH  | `/api/v1/projects/:id/archive` | Archive an active project; returns version 2                              |

Names are trimmed and must contain 1–120 characters. A project starts active at version 1. Archiving it again returns 409. Missing projects return 404; malformed IDs and request bodies return 400. The example has no authentication and is intended for local development and tests.

Storage is isolated per application instance and disappears on restart. It demonstrates the repository contract, including atomic expected-version checks; it is not durable persistence.

## HTTP behavior

- Errors use `application/problem+json` with `type`, `title`, `status`, `detail`, `code`, and `requestId`; validation errors also include field diagnostics.
- Unexpected failures return a safe message and log their internal causes. Public responses never copy exception messages.
- Every request gets a server-generated `x-request-id`. Incoming IDs are not trusted.
- Responses use explicit schemas and DTO mappings. Request bodies and raw query strings are not logged by default.
- The request body limit is 1 MiB, request timeout is 30 seconds, connection timeout is 10 seconds, and keep-alive timeout is 5 seconds.
- Requests are limited to 100 per minute per IP per process. Multi-instance deployments need a shared rate-limit store or gateway.
- Proxy trust is disabled. Configure it deliberately for a known proxy topology before relying on forwarded addresses.
- CORS credentials are disabled; only configured browser origins receive permission headers. CORS is not authentication.
- `/health/live` reports process health. `/health/ready` reports completed startup and becomes unavailable during shutdown. Both are exempt from rate limiting.
- SIGINT/SIGTERM initiate shutdown with a 10-second deadline. Required resources added later must be closed through lifecycle hooks.

## Architecture and extensions

- [Architecture conventions](docs/architecture.md)
- [Adding a business module](docs/adding-module.md)
- [Adding persistence, including MySQL](docs/adding-persistence.md)

Use the repository interface owned by a module's application layer for persistence. The starter includes no database driver, ORM, migrations, authentication provider, queue, or cache integration.

Run formatting, lint, type checking, architecture checks, tests, and the production build locally using the commands above.
