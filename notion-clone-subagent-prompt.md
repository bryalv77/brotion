# Master Prompt: Notion Clone (React + Vite + Node/Express + PostgreSQL)

## General context (give this to ALL subagents as base)

```
We are building a fully functional, self-hosted clone of Notion, meant to run on
our own local server. It must look and behave very similarly to Notion: a
workspace sidebar with nested pages, a block-based editor (text, headings, lists,
to-dos, images, tables, code, etc.), block drag&drop, infinitely nested pages,
icons/emoji and cover images per page, search, and basic multi-user support with
permissions.

Required stack:
- Frontend: React + Vite (no Next.js), TypeScript, Tailwind CSS
- Backend: Node.js + Express, TypeScript
- Database: PostgreSQL (use an ORM: Prisma recommended)
- Auth: JWT + httpOnly cookies
- Deployment: local server (Docker Compose optional to spin up Postgres)

Conventions:
- Monorepo with /frontend and /backend folders
- REST API versioned under /api/v1
- snake_case for table names, PascalCase for models
- Every subagent must leave its code working and documented (README per module)
- Don't assume other modules already exist: if you depend on an endpoint or type
  that another agent is supposed to build, define the contract (interface/schema)
  yourself and store it in /shared or /docs/contracts so the other agent can
  follow it.

MANDATORY self-verification gate — run this yourself before declaring a task done,
without asking the user to run it for you:

  1. `yarn lint`        — fix every error/warning yourself, don't just report them
  2. `yarn typecheck`   — fix every type error yourself
  3. `yarn test:e2e`    — Playwright end-to-end tests for the flows you touched

Loop: run the three commands → if anything fails, fix it → run again → repeat until
all three pass clean. Only then is the task considered "done". Include the final
passing output (or a summary of it) in your task report. If a test genuinely
requires a piece another task hasn't built yet, stub/mock it, note the gap
explicitly in your report, and don't mark that specific check as passing.

This project follows Spec-Driven Development (SDD): every task starts from a
spec file under /specs, not from a chat instruction. See `specs/README.md` and
`specs/constitution.md` (provided alongside this prompt) for the full workflow
and the templates every subagent must use to produce its own spec → plan → tasks
before writing code.
```

---

## Task 0 — Architect (run this first, single agent)

**Goal:** define the full architecture before splitting up the work.

Deliverables:
1. Architecture document/diagram (frontend, backend, DB, communication).
2. Full database schema (tables: users, workspaces, workspace_members, pages,
   blocks, page_permissions, comments, attachments, sessions).
3. API contracts (OpenAPI/Swagger, or at minimum a `contracts.md` with every
   endpoint, request/response payloads, error codes).
4. Monorepo folder structure.
5. Decision on the block-editor library (evaluate: build a custom one with
   contentEditable, use Slate.js, use TipTap). Justify the choice.

This document is a required input for every task that follows.

**Definition of Done:** spec + plan + tasks files exist under `specs/000-architecture/` and are internally consistent (schema matches contracts matches folder structure).

---

## Task 1 — Monorepo and environment setup

**Depends on:** Task 0
**Delivers:** a runnable base repo with a "hello world" in both frontend and backend

- Create `/frontend` (Vite + React + TS + Tailwind) and `/backend` (Express + TS) structure
- Configure `docker-compose.yml` with local PostgreSQL (configurable port)
- Configure Prisma (or chosen ORM) connected to Postgres via `.env`
- npm scripts: `dev`, `build`, `start`, `migrate`, `seed`
- Shared ESLint + Prettier config
- Root README explaining how to spin everything up with a single command

**Definition of Done:** `yarn dev` boots both frontend and backend against Postgres from a clean clone with one command; `yarn lint`, `yarn typecheck`, `yarn test:e2e` (smoke test) pass.

---

## Task 2 — Backend: Authentication and users

**Depends on:** Task 1, Task 0 contracts

- Models: `User`, `Session`
- Endpoints: register, login, logout, refresh token, `GET /me`
- Password hashing (bcrypt/argon2)
- JWT + httpOnly cookie + authentication middleware
- Centralized error-handling middleware
- Basic tests (register/login/protected routes)

**Definition of Done:** auth endpoints implemented per spec; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering register/login/protected-route flows pass.

---

## Task 3 — Backend: Workspaces, pages and blocks (core data layer)

**Depends on:** Task 2

- Models: `Workspace`, `WorkspaceMember`, `Page` (hierarchical tree via `parent_id`),
  `Block` (type, order, JSON content, `page_id`, `parent_block_id` for nested blocks)
- Full CRUD for workspaces, pages and blocks
- Endpoint to reorder blocks (drag&drop) and move pages within the tree
- Endpoints for duplicate page, move to trash, restore, permanently delete
- Full-text search endpoint (use Postgres `tsvector`) over titles and content
- File/image upload endpoint (page covers, images inside blocks)
- Document the JSON content shape for each block type (shared contract with frontend)

**Definition of Done:** CRUD + search + reorder implemented per spec; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering page/block CRUD and reordering pass.

---

## Task 4 — Backend: Permissions and collaboration

**Depends on:** Task 3

- `PagePermission` model (owner, editor, viewer), inheritable to subpages
- Endpoint to share a page (invite by email/user, public read-only links)
- Authorization middleware per page/workspace
- (Optional) WebSocket (socket.io) for real-time collaborative editing: cursor
  presence and block synchronization

**Definition of Done:** permissions enforced per spec; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering sharing and access-denied cases pass.

---

## Task 5 — Frontend: App shell and sidebar

**Depends on:** Task 0 (contracts); can proceed in parallel with mocks while backend is finishing

- Overall layout: collapsible left sidebar + content area, matching Notion
- Page tree in sidebar (expand/collapse, drag&drop to reorder/nest)
- "+ New page" button, quick search (Cmd+K / Ctrl+K)
- Workspace switcher, user avatar, settings
- Global state management (Zustand or React Query + Context)
- Typed API client consuming Task 0's contracts

**Definition of Done:** sidebar/shell matches spec; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering navigation, page tree, and quick search pass.

---

## Task 6 — Frontend: Block editor (most complex piece, give it its own dedicated agent)

**Depends on:** Task 0; integrates with Task 3 via contracts

- Notion-style editor: each line is an independent block
- Minimum block types: paragraph, headings H1–H3, bulleted list, numbered list,
  checkbox/to-do, quote, divider, code with syntax highlighting, image, simple
  table, callout
- "/" slash command menu to insert a block type
- Floating text-selection menu (bold, italic, underline, code, color, link)
- Drag handle to reorder blocks and nest (indent with Tab)
- Debounced autosave against the backend
- Notion-style keyboard shortcuts (Enter for new block, Backspace merges blocks,
  Tab indents)

**Definition of Done:** editor matches spec block types and shortcuts; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering block creation, reordering, and slash-menu pass.

---

## Task 7 — Frontend: Individual page view (header, cover, icon, properties)

**Depends on:** Task 5, Task 6

- Page header: editable icon/emoji, cover image (upload/change), large editable title
- Breadcrumbs for the page hierarchy
- Page options menu (duplicate, move to trash, export, share)
- Trash view (restore/permanently delete)
- Per-block comments panel (if Task 4 exposes comment endpoints)

**Definition of Done:** page view matches spec; `yarn lint`, `yarn typecheck`, `yarn test:e2e` covering icon/cover editing, trash, and sharing UI pass.

---

## Task 8 — QA, visual polish, and pixel parity with Notion

**Depends on:** all previous tasks

- Pixel-by-pixel review against real Notion: typography, spacing, colors,
  hover/drag animations, dark mode
- Basic responsiveness (mobile/tablet)
- End-to-end tests (Playwright/Cypress) for the main flows: create page, write
  content, reorder blocks, share, search
- Performance optimization (lazy loading of large pages, virtualization of long lists)

**Definition of Done:** visual parity checklist complete; full `yarn lint`, `yarn typecheck`, `yarn test:e2e` suite passes end to end across the whole app.

---

## Suggested execution order

1. Task 0 (architect) — blocks everything
2. Task 1 (setup) — blocks everything
3. In parallel: Task 2 → Task 3 → Task 4 (backend) **and** Task 5 → Task 6 → Task 7
   (frontend, using Task 0's contracts as mocks while backend progresses)
4. Real frontend-backend integration
5. Task 8 (final QA)

## Note for whoever coordinates the subagents

Give each subagent **only** its task + the general context + the docs/contracts
produced by Task 0 (and any tasks it depends on). Don't hand every subagent the
full 8-task prompt — that dilutes focus and causes redundant or inconsistent work.
