# webshell-web

Web application for WebShell.

## Structure

- `frontend/`: React application built with TypeScript, Vite, and Tailwind CSS.
- `backend/`: Node.js API foundation built with TypeScript, Fastify, and domain-driven module boundaries.

## Frontend development

Use Node.js 24.21.0 and pnpm.

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

## Validation

Run these commands from `frontend/`:

```sh
pnpm build
pnpm lint
```

## Backend development

Use the Node version in `backend/.nvmrc` and pnpm 10.18.3. From `backend/`, run `pnpm install --frozen-lockfile`, optionally run `pnpm setup:project`, then run `pnpm dev`.

The backend runs without a database or external services. See [backend setup, commands, and architecture](backend/README.md) for local development and validation commands.
