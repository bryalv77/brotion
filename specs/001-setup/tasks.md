# Tasks: 001 — Monorepo & environment setup

> Derived from plan.md. Each task is small and independently verifiable.

## Implementation
- [x] 1. Root workspace: `package.json` with yarn workspaces (frontend, backend,
      shared) and scripts (`dev`, `dev:*`, `build`, `start`, `migrate`, `seed`,
      `lint`, `typecheck`, `test:e2e`). Add `.gitignore`.
- [x] 2. Shared ESLint (`.eslintrc.cjs`) + Prettier config at root; `tsc
      --noEmit`-based `typecheck` per workspace. `tsconfig.base.json` shared.
- [x] 3. `/shared` package: `package.json` (name `@notion-clone/shared`),
      `tsconfig.json` (builds to `dist` w/ declarations), barrel `index.ts`.
      Existing `api-types.ts`, `block-schema.ts`, `contracts.md` type-check and
      are importable from both apps.
- [x] 4. `/backend`: Express app, `/api/v1/health` route, centralized error
      middleware, zod-validated env, pino logger + pino-http. Entry
      `src/server.ts` (loads `dotenv/config` first).
- [x] 5. `/backend` Prisma: `schema.prisma` (placeholder model), `seed.ts`,
      `prisma/client.ts` (lazy singleton). `migrate`/`seed` scripts wired to root.
- [x] 6. `/frontend`: Vite + React + TS scaffold, Tailwind wired
      (`tailwind.config`, `postcss.config`, `index.css` directives), `App.tsx`
      rendering "Hello, Notion clone", `api/client.ts`.
- [x] 7. `vite.config.ts` proxy `/api` → `:4000`.
- [x] 8. `docker-compose.yml`: `postgres:16` service, configurable port, named
      volume, healthcheck. Root `.env.example` + per-app `.env.example`.
- [x] 9. Playwright: `playwright.config.ts`, `tests/e2e/smoke.spec.ts` asserting
      the hello-world text renders. `test:e2e` script at root.
- [x] 10. Root README: prerequisites (Node, yarn, Colima), one-command spin-up.

## Tests
- [x] Playwright smoke e2e: load `http://localhost:5173`, assert page contains
      "Hello, Notion clone" — covers spec acceptance criterion #3.
- [x] (Manual/contract) `GET /api/v1/health` returns
      `{"data":{"status":"ok"}}` HTTP 200 — verified via curl.

## Verification gate (run before marking this feature done)
- [x] `yarn lint` — clean, zero errors/warnings
- [x] `yarn typecheck` — clean, zero errors (frontend + backend + shared)
- [x] `yarn test:e2e` — smoke test passes (1 passed)
- [x] `yarn dev` boots both services (manual sanity) — verified: backend
      :4000, frontend :5173, Vite proxy `/api` → backend, both responding.

## Docs
- [x] `specs/001-setup/` spec/plan/tasks present.
- [x] Root README updated with spin-up + script reference.
- [x] `/shared` is importable + typed from both apps (built to `dist`).

## Notes / deviations found during implementation
- **Docker runtime:** No Docker Desktop (per user). Set up **Colima** as the
  Docker runtime + installed the `docker-compose` CLI plugin via Homebrew and
  registered it in `~/.docker/config.json`. `docker compose` v5.3.1 confirmed
  working; Postgres container starts and passes its healthcheck.
- **Postgres:** `postgresql@15` is installed via brew but not running; we use the
  docker-compose `postgres:16` container instead (cleaner, project-scoped).
- **Shared package shape:** Originally tried project references / path-mapping
  to consume `.ts` source directly; that conflicted with backend `rootDir`
  under NodeNext. Settled on building `shared` to `dist` (`.js` + `.d.ts`) and
  consuming the declarations via the workspace symlink — the standard, robust
  pattern. `yarn workspace @notion-clone/shared build` emits `dist`.
- **pino-http typing:** The shipped `.d.ts` declares a callable default but the
  runtime is CJS (`module.exports = fn`); under NodeNext ESM the synthetic
  default resolves to the module namespace, not the callable. Resolved with an
  explicit typed cast off the `.pinoHttp` property.
- **Env loading:** `tsx`/`node` (unlike the `prisma` CLI) don't auto-load
  `.env`, so `server.ts` imports `dotenv/config` before `config/env.ts` runs.
- **Prisma migrate interactive prompt:** `prisma migrate dev` prompts for a
  migration name on first run; the README documents `--name <name>` for CI.

### Manual end-to-end verification (live, against running stack)
```
$ docker compose up -d              # colima runtime
$ yarn migrate --name init          # applies 20260722001238_init
$ yarn seed                         # ✓ HealthCheck#1 upserted
$ yarn dev                          # backend :4000 + frontend :5173
GET /api/v1/health  -> {"data":{"status":"ok"}}            200
GET /api/nope       -> {"error":{"code":"NOT_FOUND",...}}  404
GET :5173/api/v1/health (vite proxy) -> {"data":{"status":"ok"}}  200
```
