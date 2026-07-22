# Tasks: 000 — Architecture & Contracts

> Task 0 is a documents-only deliverable. The "implementation" is producing the
> shared artifacts that every later task builds against, then verifying they are
> internally consistent. No application code in this task.

## Implementation
- [x] Decide monorepo folder structure (plan §1) — matches `constitution.md` §3.
- [x] Define full DB schema for all 9 required tables (plan §2): users, sessions,
      workspaces, workspace_members, pages, blocks, page_permissions, comments,
      attachments. (9/9)
- [x] Define API contracts for Tasks 2–7 (plan §3) covering auth, workspaces,
      pages, blocks, search, files, permissions, comments, real-time.
- [x] Block-editor library decision (plan §5.1): **TipTap**, with justification.
- [x] Resolve spec open questions (plan §9): trash = `is_deleted`+`deleted_at`;
      comments belong to a block.
- [x] Write `/shared/contracts.md` — human-readable contract matching plan §3.
- [x] Write `/shared/api-types.ts` — TS types for all request/response shapes.
- [x] Write `/shared/block-schema.ts` — per-type `content` JSON shape for blocks.
- [x] Write `/docs/adr/0001-editor-library.md` — record the TipTap decision.
- [x] Write `/docs/architecture.md` — the diagram + layer summary from plan §1.

## Tests
- (None at runtime — Task 0 ships no code. Consistency is checked by the
  verification gate below as a cross-document review.)

## Verification gate (run before marking this feature done)
- [x] Schema ↔ contracts consistency: every endpoint's DTO fields trace to a
      model column, and every model column referenced by a DTO exists.
- [x] Folder structure in plan §1 matches `constitution.md` §3 conventions
      (monorepo, `/frontend` `/backend` `/shared` `/specs`, REST under `/api/v1`,
      snake_case tables, PascalCase models).
- [x] No contradictions with `constitution.md` (plan §8 explicitly confirms none;
      stack = React+Vite+TS+Tailwind / Express+TS / Postgres+Prisma / JWT
      httpOnly cookie / yarn / Playwright — all honored).
- [x] Acceptance criteria from `spec.md` §6 all satisfied (checked below).

## Docs
- [x] `specs/000-architecture/spec.md`, `plan.md`, `tasks.md` present.
- [x] `/shared/*` contracts created (the artifacts other tasks depend on).
- [x] `/docs/architecture.md` + `/docs/adr/0001-editor-library.md` created.

## Acceptance criteria check (from spec.md §6)
- [x] plan.md contains a complete ER-style schema for all 9 tables, with types
      and relations. → plan §2.
- [x] plan.md + `/shared/contracts.md` document every endpoint Tasks 2–7 need,
      with request/response shapes and error codes. → plan §3 + `/shared/contracts.md`.
- [x] Block-editor library decision recorded with a one-paragraph justification.
      → plan §5.1 + `/docs/adr/0001-editor-library.md`.
- [x] Folder structure documented and matches constitution conventions. → plan §1.
- [x] No contradictions with constitution.md. → plan §8.

## Notes / deviations found during implementation
- The original `spec.md` listed `page_permissions` as one of the 9 tables; plan
  §2 models it as `page_permissions` (matches). `sessions` from the spec is
  modeled as a table for refresh-token revocation (constitution §6 requires
  server-side auth state for logout to be meaningful). No deviation — both are
  within scope.
- The spec's "API contract document" acceptance criterion is satisfied by BOTH
  plan §3 (summary, authoritative) and the fuller `/shared/contracts.md`. They
  are kept in sync; `/shared` wins on any divergence by convention.
