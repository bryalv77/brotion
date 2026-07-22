# Project Constitution — Notion Clone

Non-negotiable rules that apply to every spec, plan, task, and line of code in
this project. Any plan.md that conflicts with this file is wrong — fix the plan,
not the constitution (unless the user explicitly amends this file).

## 1. Product principle
The product must look and behave like Notion for the core flows: nested pages,
block-based editing, drag&drop reordering, icons/covers, search, sharing. When
in doubt about a UX detail, match Notion's real behavior over inventing a new one.

## 2. Stack (fixed, do not substitute)
- Frontend: React + Vite, TypeScript, Tailwind CSS. No Next.js, no CRA.
- Backend: Node.js + Express, TypeScript.
- Database: PostgreSQL, accessed through Prisma.
- Auth: JWT stored in httpOnly cookies. No localStorage tokens.
- Package manager: **yarn** (all scripts and docs use `yarn`, not `npm`).
- Real-time (if implemented): socket.io.
- E2E testing: Playwright.

## 3. Repository conventions
- Monorepo: `/frontend`, `/backend`, `/specs`, `/shared` (shared types/contracts).
- REST API under `/api/v1`.
- DB tables/columns: snake_case. TS types/models: PascalCase.
- Every module ships with its own README.
- Contracts (API shapes, block JSON schemas) live in `/shared` or `/docs/contracts`
  and are the single source of truth — both frontend and backend must match them,
  not the other way around.

## 4. Spec-Driven Development is mandatory
No code is written without an approved `spec.md` and `plan.md` for that unit of
work (see `specs/README.md` for the full pipeline). Specs are living documents:
if implementation reveals the plan was wrong, update the plan first.

## 5. Verification gate (mandatory, no exceptions)
Before any task is marked done, the responsible agent runs, and fixes failures
from, all three of:
```
yarn lint
yarn typecheck
yarn test:e2e
```
A task is not "done" until all three pass clean. This is run by the agent itself,
not deferred to the user.

## 6. Security & data baseline
- Passwords hashed with bcrypt/argon2, never stored plain.
- All mutating endpoints require authentication; permission checks happen
  server-side, never trusted from the client.
- File uploads validated by type/size before storage.

## 7. Scope discipline
Each task/spec addresses exactly one feature area. If a subagent notices work
that belongs to a different task, it documents the gap/contract in `/shared` or
`/docs/contracts` rather than silently implementing the other task's scope.
