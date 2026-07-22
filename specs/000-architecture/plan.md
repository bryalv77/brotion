# Plan: 000 — Architecture & Contracts

> Technical design derived from spec.md. Respects `specs/constitution.md`.
> This document is the single source of truth that every later task builds
> against. All field names, endpoints, and block shapes defined here MUST be
> matched by both frontend and backend.

---

## 1. Architecture overview

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

**Layers (backend):** `routes → controllers → services → repositories (Prisma)`.
Controllers validate input (zod) and shape HTTP; services own business rules and
permissions; Prisma models are the persistence boundary. Cross-cutting concerns
(auth middleware, error middleware, request logging) live in `backend/src/middleware`.

**Folder map (monorepo):**
```
notion-clone/
├── frontend/                 # Vite + React + TS + Tailwind
│   ├── src/
│   │   ├── api/              # typed API client (consumes /shared)
│   │   ├── components/       # presentational + composed UI
│   │   ├── features/         # feature folders (editor, sidebar, page-view)
│   │   ├── hooks/
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # utils, query client, socket client
│   │   ├── routes/           # route components / guards
│   │   ├── types/
│   │   └── main.tsx
│   ├── tests/e2e/            # Playwright specs
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/           # env, db, security
│   │   ├── middleware/       # auth, error, rate-limit
│   │   ├── modules/          # one folder per domain (auth, users, workspaces,
│   │   │                     #   pages, blocks, permissions, comments,
│   │   │                     #   search, attachments, sessions)
│   │   │   └── <module>/      #   routes.ts, controller.ts, service.ts, schema.ts
│   │   ├── prisma/           # schema.prisma, migrations, seed
│   │   ├── utils/
│   │   └── server.ts
│   ├── tests/e2e/            # Playwright/spec API tests (or supertest)
│   └── package.json
├── shared/                   # THE single source of truth for contracts
│   ├── contracts.md          # every endpoint, request/response, error codes
│   ├── api-types.ts          # shared TS types for API req/res shapes
│   ├── block-schema.ts       # block JSON shape (frontend + backend match this)
│   └── package.json          # workspace-only, not published
├── docs/
│   ├── architecture.md       # the diagram + decision records (lifted from here)
│   └── adr/                  # architecture decision records (editor lib, etc.)
├── specs/                    # SDD specs (this folder)
├── docker-compose.yml        # local Postgres (+ optional adminer)
├── package.json              # root workspaces + scripts (dev, lint, typecheck, test:e2e)
├── .eslintrc / .prettierrc   # shared lint/format config (root)
└── README.md                 # one-command spin-up
```

---

## 2. Data model

PostgreSQL via Prisma. **Table names are snake_case** (constitution §3).
**Prisma models are PascalCase** and `@@map` to snake_case tables. Timestamps are
UTC, stored as `DateTime`. All PKs are `String` (CUID/UUID) generated in the app
layer so client and server can agree on IDs before persistence (helps optimistic
UI and offline-ish editing).

### users
```
Model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password_hash String
  name          String?
  avatar_url    String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  sessions          Session[]
  workspace_members WorkspaceMember[]
  pages             Page[]         @relation("PageCreatedBy")
  pages_updated     Page[]         @relation("PageLastUpdatedBy")
  page_permissions  PagePermission[]
  comments          Comment[]

  @@map("users")
}
```

### sessions (JWT refresh tracking / revocation)
```
Model Session {
  id            String   @id @default(cuid())
  user_id       String
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  refresh_token_hash String   // hash the refresh token; never store raw
  expires_at    DateTime
  created_at    DateTime @default(now())
  revoked_at    DateTime? // null = active; set on logout/revoke

  @@index([user_id])
  @@index([refresh_token_hash])
  @@map("sessions")
}
```
> Note: the **access token** is a short-lived JWT (15 min) in an httpOnly cookie
> and is stateless; the **refresh token** (30 days) is hashed and stored here so
> we can revoke on logout/compromise. See §6 for cookie details.

### workspaces
```
Model Workspace {
  id          String   @id @default(cuid())
  name        String
  icon        String?  // emoji
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  members WorkspaceMember[]
  pages   Page[]

  @@map("workspaces")
}
```

### workspace_members (join table with role)
```
Model WorkspaceMember {
  id           String   @id @default(cuid())
  workspace_id String
  user_id      String
  role         WorkspaceRole // OWNER | ADMIN | MEMBER
  created_at   DateTime @default(now())

  workspace Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([workspace_id, user_id])
  @@map("workspace_members")
}

enum WorkspaceRole { OWNER ADMIN MEMBER }
```

### pages (hierarchical tree)
```
Model Page {
  id            String   @id @default(cuid())
  workspace_id  String
  parent_id     String?  // null = top-level page in the workspace
  slug_title    String?  // url-friendly derived title, optional
  title         String   @default("")  // empty title until first edit (Notion-like)
  icon          String?  // emoji
  cover_url     String?
  content       Json?    // OPTIONAL cache of serialized blocks (see §block store)
  is_deleted    Boolean  @default(false)   // soft-delete / trash
  deleted_at    DateTime?
  deleted_by    String?
  created_by    String
  last_updated_by String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  workspace  Workspace  @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  parent     Page?      @relation("PageTree", fields: [parent_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children   Page[]     @relation("PageTree")
  blocks     Block[]
  created    User       @relation("PageCreatedBy",  fields: [created_by], references: [id])
  updator    User?      @relation("PageLastUpdatedBy", fields: [last_updated_by], references: [id])
  permissions PagePermission[]

  @@index([workspace_id])
  @@index([parent_id])
  @@index([is_deleted])
  // full-text search index defined at SQL level (see §Search)
  @@map("pages")
}
```
**Trash decision (answers spec open question):** use a boolean `is_deleted` +
`deleted_at`/`deleted_by` pair rather than a separate trash table. Cheaper for
the "restore" flow (single flag flip) and for excluding trash from the tree.
Permanent delete sets `is_deleted=true` already and then hard-deletes the row
(and cascade prunes children via a recursive service call — see edge cases §6).

### blocks (the editor content)
```
Model Block {
  id              String   @id @default(cuid())
  page_id         String
  parent_block_id String?  // null = top-level block of the page; set for nested blocks (e.g. table cells, list children)
  type            BlockType
  content         Json     // type-specific JSON (see /shared/block-schema.ts)
  order           Float    // fractional-indexable for drag&drop reordering
  created_by      String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  page   Page  @relation(fields: [page_id], references: [id], onDelete: Cascade)
  parent Block? @relation("BlockTree", fields: [parent_block_id], references: [id], onDelete: Cascade)
  children Block[] @relation("BlockTree")

  @@index([page_id])
  @@index([parent_block_id])
  @@index([page_id, order])
  @@map("blocks")
}

enum BlockType {
  paragraph
  heading1  heading2  heading3
  bulleted_list_item  numbered_list_item  todo
  quote  callout  divider  code
  image  table  table_row
}
```
**Order as Float (fractional indexing):** drag&drop inserts between two blocks
by taking the midpoint of neighbors' `order` values (e.g. insert between 1.0 and
2.0 → 1.5). Periodically re-normalize when gaps get too small. Avoids rewriting
every row on each reorder (an integer-rank approach would). See §6 edge cases.

**`page.content` vs rows of `Block`:** the canonical store is the `blocks` table
(one row per block) — that's what reorder, nesting, and per-block comments need.
The optional `pages.content` JSON cache is only for fast full-page load and may
be omitted entirely; backend always reconstructs from `blocks`. **Decision:
skip the cache for v1** to keep a single source of truth. `content` column is
left nullable for a future optimization, documented here so we don't re-decide.

### page_permissions (sharing — Task 4)
```
Model PagePermission {
  id          String   @id @default(cuid())
  page_id     String
  user_id     String?  // null when share_type = PUBLIC_LINK
  share_type  ShareType   // USER | PUBLIC_LINK
  access      PageAccess  // OWNER | EDITOR | VIEWER
  inherit     Boolean  @default(true)  // applies to subpages
  token       String?  // opaque token for PUBLIC_LINK
  created_at  DateTime @default(now())

  page Page @relation(fields: [page_id], references: [id], onDelete: Cascade)
  user User? @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([page_id])
  @@map("page_permissions")
}

enum ShareType  { USER PUBLIC_LINK }
enum PageAccess { OWNER EDITOR VIEWER }
```
Workspace members implicitly get EDITOR on all pages in their workspace (unless
a stricter explicit permission exists). Page owners always retain OWNER.

### comments (per-block — answers spec open question)
**Decision: comments belong to a block**, not a page. A page-level comment is
just a comment on the page's first/empty block. This matches Notion's model
(selection-based commenting) and keeps one comment thread mechanism.
```
Model Comment {
  id         String   @id @default(cuid())
  block_id   String
  page_id    String   // denormalized for fast "all comments on page" queries
  user_id    String
  body       Json     // rich text, same rich-text shape as block text
  resolved   Boolean  @default(false)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // NOTE: no FK to blocks (block can be deleted while comment persists);
  // cascade is intentionally manual — see edge cases.
  page Page @relation(fields: [page_id], references: [id], onDelete: Cascade)
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([block_id])
  @@index([page_id])
  @@map("comments")
}
```

### attachments (uploaded files/images)
```
Model Attachment {
  id          String   @id @default(cuid())
  user_id     String
  page_id     String?  // optional context (a cover is page-scoped)
  block_id    String?  // optional context (an image-in-block is block-scoped)
  file_name   String
  mime_type   String
  size_bytes  Int
  storage_key String   // path under storage root (local disk for v1)
  url         String   // served URL (signed or static depending on config)
  created_at  DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([page_id])
  @@map("attachments")
}
```
v1 storage is **local disk** under `backend/storage/` served at `/api/v1/files/:key`.
The `storage_key` abstraction lets us swap to S3 later without touching callers.

### Full-text search (Postgres tsvector, per Task 3)
A generated column + GIN index on `pages`:
```sql
ALTER TABLE pages
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content_text,''))
  ) STORED;
CREATE INDEX pages_search_idx ON pages USING GIN (search_vector);
```
Where `content_text` is a text aggregate of the page's blocks, maintained by a
trigger on `blocks` (insert/update/delete). **`search_vector` is a DB-level
concern**, not a Prisma field (Prisma reads it but doesn't manage it). This
satisfies Task 3's "Postgres tsvector over titles and content" requirement.

---

## 3. API contracts

Base URL: `/api/v1`. All mutating endpoints require a valid session cookie
(constitution §6). Responses are JSON. Standard envelope:
```json
{ "data": { ... } }            // success
{ "error": { "code": "...", "message": "...", "details": {...} } }  // failure
```
**Error code conventions:** `400` validation, `401` not authenticated,
`403` authenticated but forbidden, `404` not found, `409` conflict (e.g. dup
email), `413` payload too large (upload), `415` unsupported media type,
`422` semantic error, `500` server error.

> Full machine-readable version lives in `/shared/contracts.md` + `/shared/api-types.ts`.
> What follows is the authoritative summary — any divergence, the `/shared` files win.

### Auth (Task 2)
```
POST   /auth/register
  Body:    { email, password, name? }
  201:     { data: { user: UserDTO } }          // also sets cookie pair
  409:     email already registered
  400:     invalid email / password too short

POST   /auth/login
  Body:    { email, password }
  200:     { data: { user: UserDTO } }          // sets httpOnly cookies
  401:     invalid credentials

POST   /auth/logout
  204:     (revokes session, clears cookies)

POST   /auth/refresh
  200:     { data: { user: UserDTO } }          // rotates access token cookie
  401:     refresh token invalid/revoked/expired

GET    /me
  200:     { data: { user: UserDTO } }
  401:     not authenticated
```
`UserDTO = { id, email, name, avatar_url }` (never `password_hash`).

### Workspaces (Task 3)
```
GET    /workspaces
  200: { data: { workspaces: WorkspaceDTO[] } }   // current user's memberships

POST   /workspaces
  Body: { name, icon? }
  201: { data: { workspace: WorkspaceDTO } }      // creator becomes OWNER

GET    /workspaces/:workspaceId
  200: { data: { workspace: WorkspaceDTO } }
  403: not a member
```
`WorkspaceDTO = { id, name, icon, role }` (role = caller's role).

### Pages (Task 3)
```
GET    /workspaces/:workspaceId/pages
  Query: ?parent_id=&include_deleted=false
  200:  { data: { pages: PageSummaryDTO[] } }     // tree children of parent_id (or roots)
  403:  not a member

POST   /workspaces/:workspaceId/pages
  Body: { parent_id?, title?, icon?, cover_url? }
  201:  { data: { page: PageDTO } }

GET    /pages/:pageId
  200:  { data: { page: PageDTO, blocks: BlockDTO[] } }   // blocks ordered by `order`
  403:  no permission
  404:  not found (or in trash and viewer lacks access)

PATCH  /pages/:pageId
  Body: { title?, icon?, cover_url? }   // partial update
  200:  { data: { page: PageDTO } }

DELETE /pages/:pageId                  // move to trash (soft delete)
  Query: ?permanent=false (default) | true   // permanent hard-deletes (requires OWNER)
  204:  no content

POST   /pages/:pageId/restore          // undo trash
  200:  { data: { page: PageDTO } }

POST   /pages/:pageId/duplicate
  200:  { data: { page: PageDTO } }    // deep-copy page + blocks; new parent defaults to same
```
`PageSummaryDTO = { id, title, icon, parent_id, has_children }`
`PageDTO = PageSummaryDTO & { workspace_id, cover_url, is_deleted, created_by, created_at, updated_at }`

### Blocks (Task 3) — the core
```
POST   /pages/:pageId/blocks
  Body:   { type, content, parent_block_id?, order?, before_id?, after_id? }
          // order computed server-side if omitted, using before_id/after_id midpoints
  201:    { data: { block: BlockDTO } }

GET     /pages/:pageId/blocks
  200:   { data: { blocks: BlockDTO[] } }

PATCH   /blocks/:blockId
  Body:  { content?, type? }            // content patched in place (autosave)
  200:   { data: { block: BlockDTO } }

DELETE  /blocks/:blockId
  204:   no content                     // cascades children (nested blocks)

POST    /pages/:pageId/blocks/reorder
  Body:  { block_id, before_id?, after_id?, new_parent_block_id? }
         // moves block; server computes new `order` (+ reparent for nesting)
  200:   { data: { block: BlockDTO } }  // returns updated order/parent
```
`BlockDTO = { id, page_id, parent_block_id, type, content, order, created_at, updated_at }`
`content` is typed per `type` per `/shared/block-schema.ts`.

### Search (Task 3)
```
GET    /workspaces/:workspaceId/search?q=&limit=20
  200: { data: { results: SearchResultDTO[] } }   // tsvector over titles+content
  400: empty query
`SearchResultDTO = { page_id, title, snippet, rank }`
```

### Files / attachments (Task 3)
```
POST   /files
  Body: multipart/form-data { file, page_id?, block_id? }
  Validated: type ∈ {image/*, ...allowlist}, size ≤ MAX_UPLOAD_BYTES
  201:  { data: { attachment: AttachmentDTO } }
  413:  too large
  415:  unsupported type
GET    /files/:key            // serve the stored file (public read for v1)
```
`AttachmentDTO = { id, url, mime_type, size_bytes }`

### Permissions / sharing (Task 4)
```
GET    /pages/:pageId/permissions
  200: { data: { permissions: PermissionDTO[] } }

POST   /pages/:pageId/permissions
  Body: { user_id? | share_type: "PUBLIC_LINK", access, inherit? }
  201: { data: { permission: PermissionDTO } }

DELETE /pages/:pageId/permissions/:permissionId
  204: no content

GET    /shared/:token          // public read-only page by link token
  200: { data: { page: PageDTO, blocks: BlockDTO[] } }   // read-only shape
```
`PermissionDTO = { id, page_id, user_id?, share_type, access, inherit, token? }`

### Comments (Task 4, optional)
```
GET    /pages/:pageId/comments
  200: { data: { comments: CommentDTO[] } }
POST   /pages/:pageId/comments
  Body: { block_id, body }
  201: { data: { comment: CommentDTO } }
PATCH  /comments/:commentId   Body: { body?, resolved? }
DELETE /comments/:commentId
```
`CommentDTO = { id, block_id, page_id, user: UserDTO, body, resolved, created_at, updated_at }`

### Real-time (Task 4, optional — socket.io)
Events (server→client on `/pages/:pageId` room): `block:updated`, `block:created`,
`block:deleted`, `presence:update`. Client→server: `block:typing`. Auth via the
same session cookie passed on the socket handshake. **Marked optional; if time
does not permit, ship single-user and document the gap.**

---

## 4. Frontend components (high-level; detailed per Task 5–7)

```
<App>
  <AppShell>                          # Task 5
    <Sidebar>
      <WorkspaceSwitcher/>
      <PageTree/>                     # expand/collapse, drag&drop, "+ New page"
      <QuickSearch/>                  # Cmd/Ctrl+K palette
    </Sidebar>
    <ContentArea>
      <Routes>                        # react-router
        <PageView>                    # Task 7
          <PageHeader>                # icon/emoji, cover, title, options menu
          <Breadcrumbs/>
          <Editor>                    # Task 6 (TipTap)
            <Block/> (per block)      # slash menu, floating selection menu, drag handle
          </Editor>
          <CommentsPanel/>            # Task 4 (optional)
        </PageView>
        <TrashView/>                 # restore / permanent delete
        <SharedPageView/>            # read-only variant for /shared/:token
      </Routes>
    </ContentArea>
  </AppShell>
</App>
```
**State:** Zustand for UI/session/sidebar tree state; React Query for server
cache (pages, blocks) with optimistic updates + autosave. API client in
`frontend/src/api/` imports types from `/shared`.

---

## 5. Libraries / tools chosen (must not contradict constitution)

| Concern            | Choice                       | Why |
|--------------------|------------------------------|-----|
| Editor             | **TipTap** (ProseMirror)     | See §5.1 |
| ORM                | Prisma                       | Constitution-mandated recommendation |
| Validation         | zod                          | Infers TS types; same schema for client/server |
| State (client)     | Zustand + React Query        | Zustand for UI state, RQ for server cache |
| Routing            | react-router v6              | Vite-friendly, no Next |
| Real-time          | socket.io (optional, Task 4) | Constitution-listed option |
| E2E                | Playwright                   | Constitution-mandated |
| Hashing            | argon2 (prefer) / bcrypt     | Constitution §6 |
| Logger             | pino                         | Fast, structured |
| Dev orchestration  | docker-compose (Postgres) + `concurrently` (FE+BE) | One-command `yarn dev` |

### 5.1 Block-editor decision: **TipTap**

Considered:
- **Custom `contentEditable`** — maximal control but we'd rebuild selection
  handling, IME, undo/redo, paste sanitization. Extremely high cost for the
  block types Notion needs; not worth it for a clone.
- **Slate.js** — powerful and flexible, lower-level. Strong fit, but its API
  churned across major versions, and its tree model is document-centric rather
  than block-centric; we'd write a lot of plumbing to treat each block as a row.
- **TipTap** — built on the battle-tested ProseMirror, provides a clean
  per-node ("block") extension model, headless (we style with Tailwind to hit
  Notion pixel parity), first-class TS types, slash-command and floating-menu
  extensions out of the box, and serializes to JSON that maps cleanly to our
  `blocks.content` schema.

**Verdict: TipTap.** It gives us a block-as-node model, JSON serialization that
matches `/shared/block-schema.ts`, and a headless core we can skin to match
Notion. Justification recorded in `docs/adr/0001-editor-library.md`.

---

## 6. Edge cases & error handling

- **Auth:** access token 15 min; refresh 30 d, hashed in `sessions`. On 401 from
  an API call, the client transparently calls `/auth/refresh` once, retries.
  Logout revokes the session row and clears both cookies.
  - **Cookies:** `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`.
  - **CSRF:** SameSite=Lax + custom-header check on mutating requests (the API
    client sends `X-Requested-With`).
- **Block reordering collisions:** if two clients insert at the same midpoint,
  `order` ties are broken by `updated_at` then `id`. Background job re-normalizes
  `order` when the smallest gap in a page drops below 1e-6.
- **Nesting cycles:** `parent_block_id` and `parent_id` updates validate that
  the new parent is not the node itself or one of its descendants (service-level
  check before commit).
- **Trash / permanent delete:** soft delete sets `is_deleted=true, deleted_at=now`.
  Permanent delete (OWNER only) recursively hard-deletes the page and all
  descendant pages + their blocks in a transaction. Trashed pages are excluded
  from tree/search by default; `?include_deleted=true` exposes them.
- **Block deletion vs comments:** deleting a block does NOT cascade-delete
  comments (no FK); comments are marked with the (now-orphaned) `block_id` and
  hidden from UI but retained for audit. Documented as a deliberate choice.
- **Uploads:** validate MIME via magic bytes (not just header) + extension
  allowlist; reject > `MAX_UPLOAD_BYTES` before reading the whole body.
- **Permissions:** every page/workspace route resolves the caller's effective
  access (workspace role ∪ explicit page permission ∪ inheritance) server-side
  before returning data; never trust client flags.
- **Optimistic UI failures:** RQ rolls back on 4xx/5xx and surfaces a toast.

---

## 7. Non-functional considerations

- **Performance:** blocks indexed by `(page_id, order)` for O(1)-ish page load;
  long pages get virtualized rendering in the editor (Task 8). Search uses a GIN
  index so it stays sub-ms at reasonable scale.
- **Security:** argon2 hashing; parameterized queries via Prisma (no raw string
  SQL except the search trigger, which is static); httpOnly cookies; permission
  checks server-side; file upload validation.
- **Accessibility:** semantic headings from block types, keyboard-navigable tree
  and slash menu, focus-visible styles. (Detailed a11y pass is Task 8.)
- **Observability:** pino request logs; structured error IDs returned to client
  for 500s (no stack leaks).

---

## 8. Deviations from constitution.md

**None.** Stack, conventions, SDD pipeline, and verification gate are all
respected. If any later plan needs a deviation, it must justify it here and flag
to the user explicitly per constitution §0.

---

## 9. Decisions that resolve the spec's open questions

| Question (from spec.md §7) | Decision | Where |
|----------------------------|----------|-------|
| Soft-delete as boolean vs `deleted_at`? | Both: `is_deleted` boolean + `deleted_at`/`deleted_by`. Boolean is the filter, timestamp is for audit/restore ordering. | §2 pages |
| Do comments belong to a block or a page? | **Block.** Page-level comments attach to a designated block; one mechanism. | §2 comments |
