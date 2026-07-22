# Plan: 001 — Monorepo & environment setup

> Technical design derived from spec.md. Respects `specs/constitution.md` and
> the architecture in `specs/000-architecture/plan.md`.

## 1. Architecture overview

This task produces the runnable base. No domain logic — just the three workspaces
(`frontend`, `backend`, `shared`), the DB container, and the tooling scripts.

```
notion-clone/                         (root = yarn workspace root)
├── package.json                      workspaces: frontend, backend, shared
├── docker-compose.yml                postgres:16 service (Colima-compatible)
├── .env.example                      DATABASE_URL, ports, JWT secrets (root-level copy)
├── .eslintrc.cjs / .prettierrc       shared lint/format
├── frontend/
│   ├── package.json                  vite, react, react-dom, tailwind, ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts                proxy /api → backend (:4000)
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── playwright.config.ts
│   ├── tests/e2e/smoke.spec.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                   renders "Hello, Notion clone"
│       ├── index.css                 @tailwind base/components/utilities
│       └── api/client.ts             typed fetch wrapper (imports @notion-clone/shared)
├── backend/
│   ├── package.json                  express, prisma, zod, pino, ts
│   ├── tsconfig.json
│   ├── nodemon.json / tsx dev        tsx for dev, tsc for build
│   ├── .env.example
│   └── src/
│       ├── server.ts                 boots Express, mounts /api/v1, error middleware
│       ├── config/env.ts             zod-validated env
│       ├── app.ts                    Express app composition (testable)
│       ├── middleware/error.ts       centralized error handler
│       └── modules/
│           └── health/
│               ├── health.routes.ts  GET /api/v1/health
│               └── health.controller.ts
└── shared/
    ├── package.json                  name: @notion-clone/shared (workspace pkg)
    ├── tsconfig.json
    ├── contracts.md                  (already exists from Task 0)
    ├── api-types.ts                  (already exists from Task 0)
    └── block-schema.ts              (already exists from Task 0)
```

Dev flow: `yarn dev` (root) → `concurrently` runs `yarn:dev:frontend` and
`yarn:dev:backend`. Vite proxies `/api` to `http://localhost:4000`. Backend runs
via `tsx watch` on `:4000`.

## 2. Data model

No real models yet. A single placeholder model exists only so `prisma migrate`
has something to run and `yarn migrate`/`yarn seed` are real commands. Task 2+
replaces the schema body.

`backend/prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// Placeholder — real models land in Task 2 (auth) onward.
model HealthCheck {
  id        Int      @id @default(1)
  checkedAt DateTime @default(now())
}
```
A `seed.ts` upserts the single `HealthCheck` row so `yarn seed` is meaningful.

## 3. API contracts

Only one endpoint this task (defined in `/shared/contracts.md` lineage, though
health is infra so it's documented here):
```
GET /api/v1/health
  200: { "data": { "status": "ok" } }
```
This endpoint MUST NOT touch the database (spec open question: backend boots even
if DB is unreachable). DB connectivity is validated separately via `yarn migrate`.

## 4. Frontend components
- `App.tsx` — renders the hello-world heading. Tailwind classes for styling.
- `api/client.ts` — a typed `request<T>()` wrapper around `fetch` that prefixes
  `/api/v1` and unwraps the `{ data }` envelope. Not heavily used this task but
  establishes the pattern every later task reuses.

## 5. Libraries/tools chosen
| Concern | Choice | Why |
|--------|--------|-----|
| Build/dev (FE) | Vite 5 | Constitution §2 (React + Vite) |
| Dev runner (BE) | tsx | Fast TS dev server, no separate build step needed for dev |
| Concurrent dev | concurrently | Single `yarn dev` boots both |
| ORM | Prisma | Constitution §2 |
| Validation | zod | Architectural choice (Task 0 plan §5) |
| Logger | pino | Architectural choice |
| Lint | ESLint + @typescript-eslint | Shared at root |
| Format | Prettier | Shared at root |
| E2E | Playwright | Constitution §2 |
| CSS | Tailwind 3 | Constitution §2 |
| DB | PostgreSQL 16 (docker compose) | Constitution §2; Colima is the host runtime |

No deviation from `constitution.md`.

## 6. Edge cases & error handling
- **DB unreachable:** `GET /health` still returns 200 (no DB call). Prisma is
  instantiated lazily; only `yarn migrate`/`yarn seed` require a live DB.
- **Port conflicts:** frontend 5173, backend 4000, Postgres 5432 — all
  overridable via env (`FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT`).
- **Colima not running:** README documents `colima start` as a prerequisite;
  `docker compose up` fails clearly if Colima is down. App still runs against
  any external Postgres via `DATABASE_URL`.
- **Missing `.env`:** `.env.example` is the template; apps fail fast with a clear
  message if required vars are missing (zod validation in `config/env.ts`).

## 7. Non-functional considerations
- TS `strict: true` everywhere so `yarn typecheck` is meaningful from day one.
- ESLint configured to error on unused vars / `any` (no warnings-only loopholes
  in the gate).
- `.gitignore` covers `node_modules`, `dist`, `.env`, `backend/storage`.

## 8. Deviations from constitution.md
None.

## 9. Resolution of spec open question
**DB availability:** Docker Compose IS available on this machine via Colima
(`docker compose` v5.3.1 confirmed). So `docker-compose.yml` is a first-class,
working path, and the default `DATABASE_URL` points at the compose service.
The backend `/health` endpoint remains DB-free so the app still boots without
a running DB (defensive belt-and-suspenders).
