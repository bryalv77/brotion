# Plan: 003 — Workspaces, pages, blocks, search & uploads

> Technical design derived from spec.md. Respects `specs/constitution.md` and
> `specs/000-architecture/plan.md` §2/§3. Builds on `001-setup`, `002-auth`.

## 1. Architecture overview

New backend modules under `backend/src/modules/`:
- `workspaces/` — workspace + membership CRUD
- `pages/` — page tree, trash/restore, duplicate
- `blocks/` — block CRUD + fractional-index reorder + nesting/cycle guard
- `search/` — tsvector search across a workspace
- `files/` — upload + serve attachments

Shared helpers under `backend/src/modules/<module>/`:
- `permissions.service.ts` — `assertWorkspaceMember`, `assertPageAccess`,
  `getEffectiveAccess` (workspace role ∪ page permission; Task 4 adds the latter
  half, for now only workspace role matters).

All routes: `requireAuth` → per-route membership check → controller → service.

## 2. Data model

Adds to the existing `User`/`Session`:

```prisma
enum WorkspaceRole { OWNER ADMIN MEMBER }
enum BlockType {
  paragraph heading1 heading2 heading3
  bulleted_list_item numbered_list_item todo
  quote callout divider code
  image table table_row
}

model Workspace {
  id         String   @id @default(cuid())
  name       String
  icon       String?
  created_by String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  members    WorkspaceMember[]
  pages      Page[]
  @@map("workspaces")
}

model WorkspaceMember {
  id           String        @id @default(cuid())
  workspace_id String
  user_id      String
  role         WorkspaceRole
  created_at   DateTime      @default(now())
  workspace    Workspace     @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  user         User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@unique([workspace_id, user_id])
  @@map("workspace_members")
}

model Page {
  id              String   @id @default(cuid())
  workspace_id    String
  parent_id       String?
  title           String   @default("")
  icon            String?
  cover_url       String?
  content_text    String   @default("")   // denormalized text for search
  is_deleted      Boolean  @default(false)
  deleted_at      DateTime?
  deleted_by      String?
  created_by      String
  last_updated_by String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  workspace       Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  parent          Page?     @relation("PageTree", fields: [parent_id], references: [id], onDelete: NoAction)
  children        Page[]    @relation("PageTree")
  blocks          Block[]
  @@index([workspace_id])
  @@index([parent_id])
  @@index([is_deleted])
  @@map("pages")
}

model Block {
  id              String    @id @default(cuid())
  page_id         String
  parent_block_id String?
  type            BlockType
  content         Json
  order           Float
  created_by      String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  page            Page      @relation(fields: [page_id], references: [id], onDelete: Cascade)
  parent          Block?    @relation("BlockTree", fields: [parent_block_id], references: [id], onDelete: Cascade)
  children        Block[]   @relation("BlockTree")
  @@index([page_id])
  @@index([parent_block_id])
  @@index([page_id, order])
  @@map("blocks")
}

model Attachment {
  id          String   @id @default(cuid())
  user_id     String
  page_id     String?
  block_id    String?
  file_name   String
  mime_type   String
  size_bytes  Int
  storage_key String
  url         String
  created_at  DateTime @default(now())
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([page_id])
  @@map("attachments")
}
```

User gets relation fields for workspace membership & attachments (added to the
existing model). The `pages.content_text` + a generated tsvector + GIN index are
created via a raw SQL migration step (Prisma can't declare generated columns).

## 3. API contracts

Exactly `shared/contracts.md`. Re-summarized for the plan:
- Workspaces: `GET /workspaces`, `POST /workspaces`, `GET /workspaces/:id`.
- Pages: `GET /workspaces/:id/pages?parent_id=`, `POST`, `GET /pages/:id`,
  `PATCH /pages/:id`, `DELETE /pages/:id?permanent=`, `POST /pages/:id/restore`,
  `POST /pages/:id/duplicate`.
- Blocks: `POST /pages/:id/blocks`, `GET /pages/:id/blocks`, `PATCH /blocks/:id`,
  `DELETE /blocks/:id`, `POST /pages/:id/blocks/reorder`.
- Search: `GET /workspaces/:id/search?q=`.
- Files: `POST /files`, `GET /files/:key`.

DTOs as defined in `shared/api-types.ts` (`PageDTO`, `BlockDTO`, etc.). Errors
follow the existing envelope (`403` forbidden, `404` not found, `422` cycle, etc.).

## 4. Frontend components
None (backend-only task).

## 5. Libraries / tools
| Concern | Choice | Why |
|--------|--------|-----|
| Multipart upload | `multer` | De facto Express middleware, typed via `@types/multer` |
| File validation | magic-bytes check via `file-type` | Not just trusting the extension/header |
| Fractional order | plain Float math | No library; midpoint + occasional renormalize |
| Search | Postgres tsvector (raw SQL) | Constitution §2; no extra dep |

All within constitution. No deviation.

## 6. Edge cases & error handling
- **Membership:** every read/write resolves `req.user`'s membership in the
  relevant workspace; absent → 403. Pages resolve their workspace transitively.
- **Fractional order:** `computeOrder(before, after)`:
  - both null → append: last sibling's order + 1.0 (or 1.0 if empty)
  - before only → before.order + 1.0
  - after only → after.order - 1.0
  - both → midpoint `(before + after) / 2`
  - if `before >= after` → 422 (invalid anchor pair)
  - if gap < 1e-6 after midpoint → renormalize all siblings in a transaction
- **Cycle guard (reparent):** walking up `parent_block_id` from the candidate
  new parent; if we reach the moved block → 422. Same for page `parent_id`.
- **Trash:** soft delete flips `is_deleted` + sets `deleted_at`/`deleted_by`.
  Permanent delete (OWNER) recursively hard-deletes descendants in a transaction.
- **content_text maintenance:** on block create/update/delete, recompute the
  page's `content_text` from its text-bearing blocks (cheap; pages are small).
- **Upload validation:** extension allowlist `{png,jpg,jpeg,gif,webp,svg,pdf}`,
  magic-byte check, size ≤ `MAX_UPLOAD_BYTES`. Reject before reading whole body
  where possible (multer `limits.fileSize`).
- **Permission escalation:** a MEMBER cannot permanently delete; only OWNER.

## 7. Non-functional considerations
- Indexes on `(page_id, order)` for O(n) page load ordered.
- GIN index on the tsvector for sub-ms search at reasonable scale.
- Attachment `storage_key` abstraction keeps S3 swap a one-place change.

## 8. Deviations from constitution.md
None.

## 9. Resolution of spec open questions
- **Reorder normalization:** lazy in-code (no trigger).
- **Search content_text:** denormalized TEXT column on `pages`, updated on block
  writes, with a generated tsvector + GIN index.
- **Uploads:** local disk under `backend/storage/` via `storage_key`.
