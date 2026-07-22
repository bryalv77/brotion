# Notion Clone

A self-hosted clone of Notion, built with the **Spec-Driven Development**
pipeline (`spec.md → plan.md → tasks.md → implementation → verification gate`).
See [`specs/README.md`](./specs/README.md) and
[`specs/constitution.md`](./specs/constitution.md) for the workflow and the
non-negotiable rules.

## Stack

- **Frontend:** React + Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js + Express, TypeScript
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT in httpOnly cookies (from Task 2)
- **E2E:** Playwright

## Prerequisites

| Tool | Why | Install |
|------|-----|---------|
| Node.js ≥ 20 | Runtime + tooling | https://nodejs.org or `brew install node` |
| Yarn 1.x | Package manager (constitution §2) | `corepack enable && corepack prepare yarn@1 --activate` |
| Docker runtime | Postgres container | **Colima** (no Docker Desktop): `brew install colima` then `colima start` |
| `docker compose` | Orchestrate Postgres | `brew install docker-compose` (registers the plugin for Colima) |

> No Docker Desktop. This repo assumes **Colima** as the Docker runtime; the
> `docker-compose.yml` works against it directly.

## Quick start (one command)

```bash
colima start          # start the Docker runtime (once per boot)
yarn db:up            # start Postgres via docker compose
yarn install          # install all workspaces
cp backend/.env.example backend/.env      # backend config (DATABASE_URL etc.)
yarn migrate          # create/apply Prisma migrations
yarn seed             # seed the placeholder row
yarn dev              # frontend :5173 + backend :4000, concurrently
```

Then open http://localhost:5173 — you should see **"Hello, Notion clone"** with
the backend health badge reading `ok`.

> The frontend and backend start **even without a running database** — the
> `/api/v1/health` endpoint is deliberately DB-free. Only `yarn migrate` /
> `yarn seed` require Postgres.

## Scripts (run from the repo root)

| Script | What it does |
|--------|--------------|
| `yarn dev` | Start frontend (Vite) + backend (tsx watch) concurrently |
| `yarn build` | Type-check + build all workspaces |
| `yarn start` | Run the built backend (`dist/server.js`) |
| `yarn migrate` | `prisma migrate dev` (create/apply migrations) |
| `yarn seed` | Run the Prisma seed script |
| `yarn lint` | ESLint across the whole workspace |
| `yarn typecheck` | `tsc --noEmit` across all workspaces |
| `yarn test:e2e` | Playwright end-to-end tests (auto-starts Vite) |
| `yarn db:up` / `yarn db:down` | Start / stop the Postgres container |

## Repository layout

```
notion-clone/
├── frontend/      Vite + React + TS + Tailwind (Playwright lives here)
├── backend/       Express + TS + Prisma (modules per domain)
├── shared/        API + block contracts (single source of truth for both apps)
├── docs/          architecture + ADRs
├── specs/         SDD specs (constitution, README, per-feature folders)
└── docker-compose.yml
```

## Spec-Driven Development

No code is written without an approved `spec.md` + `plan.md` for that unit of
work. Per-feature specs live under `specs/NNN-name/`. The current state:

- [`specs/000-architecture`](./specs/000-architecture) — ✅ architecture,
  DB schema, API contracts, editor decision
- [`specs/001-setup`](./specs/001-setup) — ✅ monorepo & environment (this task)

## Verification gate

Every task must pass clean before it's considered done (constitution §5):

```bash
yarn lint
yarn typecheck
yarn test:e2e
```
