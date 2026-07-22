# Spec: 000 — Architecture & Contracts

> This is a worked example showing the spec template filled in for Task 0 of the
> master prompt. Use it as a reference for the format, not as a fixed answer —
> the architect agent should still produce its own real spec/plan/tasks.

## 1. Summary
Before any feature is built, define the system architecture, database schema,
API contracts, folder structure, and the block-editor technology choice, so that
every later task has a stable, shared foundation to build against.

## 2. Motivation / user stories
- As a subagent building the backend, I want a finalized DB schema and contracts,
  so I don't have to guess field names or invent a shape another agent will
  also invent differently.
- As a subagent building the frontend, I want typed API contracts, so I can build
  against mocks while the real backend is still in progress.

## 3. Scope
### In scope
- Database schema for: users, workspaces, workspace_members, pages, blocks,
  page_permissions, comments, attachments, sessions.
- API contract document covering all endpoints needed by Tasks 2–7.
- Monorepo folder structure decision.
- Block-editor technology decision (custom / Slate.js / TipTap) with justification.

### Out of scope (explicitly deferred to another task)
- Actual implementation of any endpoint (Tasks 2–4).
- Actual implementation of any UI (Tasks 5–7).

## 4. User-facing behavior
N/A — this is an internal/technical spec, not a user-facing feature. (Specs for
internal/infra work skip section 4 or replace it with "Developer-facing behavior".)

## 5. Dependencies
- Depends on spec(s): none (this is the first spec in the project).
- Depended on by: every other spec (001-auth, 002-pages-and-blocks, etc.).

## 6. Acceptance criteria
- [ ] `specs/000-architecture/plan.md` contains a complete ER-style schema for all
      9 tables listed above, with types and relations.
- [ ] `specs/000-architecture/plan.md` (or a linked `contracts.md`) documents every
      endpoint Tasks 2–7 will need, with request/response shapes and error codes.
- [ ] A decision on the block-editor library is recorded with a one-paragraph
      justification.
- [ ] Folder structure is documented and matches `constitution.md` conventions.
- [ ] No contradictions with `constitution.md`.

## 7. Open questions
- Do we need soft-delete (trash) as a boolean flag or a separate `deleted_at`
  timestamp on `pages`? → decide in plan.md.
- Do comments belong to a block or a page? → decide in plan.md, document in contract.
