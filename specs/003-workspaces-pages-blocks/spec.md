# Spec: 003 — Workspaces, pages, blocks, search & uploads

## 1. Summary
The core data layer: workspaces (with membership), hierarchical pages (tree,
trash/restore, duplicate), blocks (typed, nestable, drag-and-drop reorderable
via fractional indexing), full-text search (Postgres tsvector over titles +
block content), and file uploads (images / attachments). All endpoints from
`000-architecture/plan.md` §3, gated behind Task 2's auth.

## 2. Motivation / user stories
- As a user, I want to create a workspace so I own a space for my pages.
- As a user, I want to create pages (and sub-pages) in a tree, so I can organize.
- As a user, I want to write content as blocks (paragraphs, headings, lists,
  to-dos, quotes, callouts, code, images, tables) and reorder them by drag/drop.
- As a user, I want to nest blocks (lists under paragraphs, table rows under a
  table) so content can be structured.
- As a user, I want to soft-delete pages to trash and restore them.
- As a user, I want to duplicate a page (deep copy of blocks).
- As a user, I want to search across a workspace's pages by title and content.
- As a user, I want to upload an image and reference it in an image block.
- As an attacker, I must not access a workspace/page/block I don't belong to.

## 3. Scope
### In scope
- `Workspace`, `WorkspaceMember`, `Page`, `Block`, `Attachment` Prisma models.
- Membership enforcement: every workspace/page/block route checks the caller is
  a member (or owner) before reading/writing.
- Workspaces: `GET /workspaces`, `POST /workspaces`, `GET /workspaces/:id`.
- Pages: list children, create, get (with blocks), patch, delete (trash +
  permanent), restore, duplicate.
- Blocks: create (with computed `order`), list by page, patch, delete, reorder
  (+ reparent), cycle guard for nesting.
- Search: `GET /workspaces/:id/search?q=` via tsvector.
- Files: `POST /files` (multipart upload, validated), `GET /files/:key` (serve).
- E2E tests covering each happy path + the key permission/trash/cycle cases.

### Out of scope
- Sharing/permissions/public links/comments/real-time (Task 4).
- Frontend (Tasks 5–7).

## 4. Developer-facing behavior
- All routes require auth (`requireAuth`) and the CSRF header on mutating methods.
- Workspace membership is checked server-side; non-members get 403.
- Pages are owned by a workspace; a member of the workspace can read/write pages.
- Blocks belong to a page; ordering is by `order` ASC, ties broken by `created_at`.
- `order` is a Float; reorder computes the midpoint of neighbors, falling back to
  ±1.0 at the ends, and re-normalizes when the gap drops below 1e-6.
- Trash sets `is_deleted=true` + `deleted_at`; tree/search exclude trash by
  default. Permanent delete (OWNER) recursively hard-deletes.
- Search returns `{ page_id, title, snippet, rank }` ranked by relevance.
- Uploads validated by extension allowlist + size cap; stored under
  `backend/storage/`; served at `/api/v1/files/:key`.

## 5. Dependencies
- Depends on: `000-architecture` (schema/contracts), `001-setup` (Express,
  Prisma, error mw), `002-auth` (requireAuth, req.user).
- Depended on by: `004-collab` (permissions/comments reference pages/blocks),
  Tasks 5–7 (frontend consumes these APIs).

## 6. Acceptance criteria (each must be testable 1:1 by e2e)
- [ ] Create a workspace; it appears in `GET /workspaces`; creator is OWNER.
- [ ] Non-member cannot `GET /workspaces/:id` (403).
- [ ] Create a page under a workspace; it appears in the children list.
- [ ] `GET /pages/:id` returns the page + its blocks ordered by `order`.
- [ ] Patch a page (title/icon/cover); changes persist.
- [ ] Delete a page → trash (is_deleted=true); excluded from children list;
      `restore` brings it back.
- [ ] Duplicate a page → new page with copied blocks.
- [ ] Create blocks with before/after ids → `order` is between them.
- [ ] Reorder a block (move between two others) → `order` updates correctly.
- [ ] Patch a block's content; change persists.
- [ ] Delete a block cascades its children.
- [ ] Reorder that would create a cycle (move a block under its descendant) → 422.
- [ ] Search by a word in a page title/content returns that page with a snippet.
- [ ] Upload an image file → 201 with a url; `GET /files/:key` serves bytes.
- [ ] Oversized / wrong-type upload → 413 / 415.
- [ ] Non-member cannot read/write a page in a workspace they don't belong to.

## 7. Open questions
- Reorder normalization: trigger vs. lazy. → plan: lazy in-code on reorder when
  gap < 1e-6, no DB trigger (keeps it simple; revisit only if collisions bite).
- Search content_text maintenance: trigger vs. materialized. → plan: maintain a
  denormalized `content_text` TEXT column on `pages` updated on block write, with
  a generated tsvector over `title || content_text`. Simpler than a per-block
  trigger and sufficient for v1 scale.
- Upload streaming: disk now, S3 later. → plan: disk via the `storage_key`
  abstraction so swap-out is a one-place change.
