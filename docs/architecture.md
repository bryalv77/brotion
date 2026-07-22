# Architecture — Notion Clone

This document summarizes the system architecture. Authoritative detail lives in
`specs/000-architecture/plan.md`; this file is the quick-reference overview.

## System diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                              Browser                              │
│  React (Vite) + TypeScript + Tailwind                            │
│  - App shell + sidebar (Task 5)                                   │
│  - Block editor: TipTap (Task 6)                                  │
│  - Page view: header/cover/icon (Task 7)                          │
│  - Typed API client consuming /shared contracts                   │
└───────────────┬───────────────────────────────────┬──────────────┘
                │  REST over HTTP  (/api/v1)         │ socket.io (Task 4, optional)
                ▼                                    ▼
┌──────────────────────────────────────┐   ┌────────────────────────┐
│  Backend: Node.js + Express + TS     │   │  socket.io gateway     │
│  - Auth middleware (JWT cookie)      │◄──┤  (real-time presence,  │
│  - Route controllers                 │   │   block sync — opt-in) │
│  - Service layer (business rules)    │   └────────────────────────┘
│  - Prisma ORM                        │
│  - Centralized error handler         │
└───────────────┬──────────────────────┘
                ▼
┌──────────────────────────────────────┐
│  PostgreSQL                          │
│  (docker-compose, configurable port) │
└──────────────────────────────────────┘
```

## Layers

**Backend** (`routes → controllers → services → repositories (Prisma)`):
- **Routes** declare the URL surface and attach validators + middleware.
- **Controllers** parse/validate input (zod), call services, shape HTTP.
- **Services** own business rules, permission checks, and transactions.
- **Prisma models** are the persistence boundary; raw SQL is reserved for the
  search trigger (static, parameter-safe).

Cross-cutting concerns (`backend/src/middleware`): auth, error handling, request
logging (pino), rate limiting.

## Data model (summary)

Nine tables (see `specs/000-architecture/plan.md` §2 for full DDL):
`users`, `sessions`, `workspaces`, `workspace_members`, `pages`, `blocks`,
`page_permissions`, `comments`, `attachments`.

Key choices:
- **Hierarchical pages** via `pages.parent_id` (self-reference).
- **Blocks** as one row per block, `parent_block_id` for nesting, `order` as a
  Float (fractional indexing) for cheap drag&drop reordering.
- **Soft delete** via `is_deleted` + `deleted_at`/`deleted_by` (restore = flag flip).
- **Comments attach to a block**; deleting a block retains its comments (no FK).
- **Search** via a Postgres `tsvector` generated column + GIN index, kept in sync
  by a trigger on `blocks`.

## Folder structure

```
notion-clone/
├── frontend/            # Vite + React + TS + Tailwind
├── backend/             # Express + TS + Prisma
├── shared/              # API + block contracts (single source of truth)
├── docs/                # architecture + ADRs
├── specs/               # SDD specs (constitution, README, per-feature folders)
├── docker-compose.yml   # local Postgres
└── package.json         # root workspaces + scripts
```
See `plan.md` §1 for the full tree.

## Cross-cutting decisions

| Concern | Decision |
|--------|----------|
| Auth | JWT access (15m) + hashed refresh (30d) in `sessions`, both httpOnly cookies |
| Editor | TipTap (see `docs/adr/0001-editor-library.md`) |
| State | Zustand (UI) + React Query (server cache) |
| Validation | zod, shared by client & server |
| Real-time | socket.io, optional (Task 4) |
| Storage | local disk under `backend/storage/`, abstracted via `storage_key` |

## Verification gate (applies to every task)

```
yarn lint
yarn typecheck
yarn test:e2e
```
All three must pass clean before a task is marked done (constitution §5).
