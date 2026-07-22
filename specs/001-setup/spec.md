# Spec: 001 — Monorepo & environment setup

## 1. Summary
Create a runnable monorepo base: a Vite + React + TypeScript + Tailwind frontend
and an Express + TypeScript backend, wired to PostgreSQL via Prisma, with a
single-command dev experience and the lint/typecheck/test tooling the whole
project will rely on.

## 2. Motivation / user stories
- As a developer, I want to clone the repo and run `yarn dev` to see a working
  frontend and backend, so I can start building features immediately.
- As a later subagent, I want `yarn lint`, `yarn typecheck`, and `yarn test:e2e`
  to already exist and pass, so my verification gate is real and not invented.
- As a later subagent, I want the Prisma schema skeleton and DB connection in
  place, so Task 2+ can add models without re-scaffolding.

## 3. Scope
### In scope
- `/frontend` (Vite + React + TS + Tailwind) with a "hello world" page.
- `/backend` (Express + TS) with a `/api/v1/health` endpoint and Prisma wired up.
- `/shared` package, type-checkable, importable by both apps.
- Root `package.json` with yarn workspaces and scripts: `dev`, `build`, `start`,
  `migrate`, `seed`, `lint`, `typecheck`, `test:e2e`.
- Shared ESLint + Prettier config at the root.
- `docker-compose.yml` for local Postgres (optional; app also runs against any
  Postgres reachable via `DATABASE_URL`).
- `.env.example` files documenting required variables.
- Root README with one-command spin-up instructions.
- A Playwright smoke e2e test that loads the frontend and asserts the hello world.

### Out of scope
- Any auth/page/block feature (Tasks 2–7).
- Implementing the real Prisma models from Task 0 (only the connection + an empty
  schema placeholder; Task 2+ populates models).
- Installing Postgres itself or Docker Compose on the host (documented as a
  prerequisite; not auto-installed).

## 4. Developer-facing behavior
- `yarn dev` from the repo root starts both frontend (Vite, default 5173) and
  backend (Express, default 4000) concurrently, and prints where each is running.
- `yarn build` type-checks and builds both apps.
- `yarn lint` and `yarn typecheck` run across the whole workspace and exit clean.
- `yarn test:e2e` runs Playwright; the smoke test passes against the running app.
- `yarn migrate` and `yarn seed` apply Prisma migrations and seed script.
- The frontend renders a hello-world page; the backend serves a JSON health check.

## 5. Dependencies
- Depends on spec(s): `000-architecture` (folder structure, stack, conventions).
- Depended on by: every later task (they all assume this base exists).

## 6. Acceptance criteria (must be testable 1:1 by e2e tests)
- [ ] `yarn dev` boots frontend on :5173 and backend on :4000 from a clean clone.
- [ ] `GET /api/v1/health` returns `{ "data": { status: "ok" } }` with HTTP 200.
- [ ] The frontend's root route renders text containing "Hello, Notion clone".
- [ ] `yarn lint` exits 0 with no warnings.
- [ ] `yarn typecheck` exits 0 across all workspaces.
- [ ] `yarn test:e2e` runs the Playwright smoke test and it passes.
- [ ] Prisma is configured against `DATABASE_URL` and `yarn migrate` runs without
      error when a Postgres is reachable at that URL.

## 7. Open questions
- Host Postgres/Docker Compose availability: not guaranteed on this machine.
  → plan.md: make the DB connection fully `DATABASE_URL`-driven; `yarn dev`
  must still boot the frontend + backend even if the DB is unreachable (backend
  health check must not require a DB connection).
