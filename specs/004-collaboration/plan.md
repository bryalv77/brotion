# Plan: 004 — Collaboration: permissions, sharing & comments

> Technical design derived from spec.md. Respects `specs/constitution.md` and
> `specs/000-architecture/plan.md` §2/§3 (PagePermission/Comment schema,
> permissions/comments contracts). Builds on Tasks 1–3.

## 1. Architecture overview

Two new backend modules:
- `permissions/` — page-level sharing (per-user + public link) + effective-access
  resolution. Extends the existing `permissions.service.ts` from Task 3 with the
  page-permission composition.
- `comments/` — per-block comment CRUD.

The existing `getAccessiblePage` (Task 3) is upgraded to compose workspace
membership with explicit page permissions + ancestor inheritance. The public
`/shared/:token` route uses a separate path that doesn't require auth.

## 2. Data model

```prisma
enum ShareType  { USER PUBLIC_LINK }
enum PageAccess { OWNER EDITOR VIEWER }

model PagePermission {
  id          String     @id @default(cuid())
  page_id     String
  user_id     String?    // null when share_type = PUBLIC_LINK
  share_type  ShareType
  access      PageAccess
  inherit     Boolean    @default(true)
  token       String?    // opaque token for PUBLIC_LINK
  created_at  DateTime   @default(now())
  page        Page       @relation(fields: [page_id], references: [id], onDelete: Cascade)
  user        User?      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([page_id])
  @@map("page_permissions")
}

model Comment {
  id         String   @id @default(cuid())
  block_id   String
  page_id    String
  user_id    String
  body       Json
  resolved   Boolean  @default(false)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  page       Page     @relation(fields: [page_id], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([block_id])
  @@index([page_id])
  @@map("comments")
}
```

Page gets `permissions PagePermission[]` and `comments Comment[]` relation
fields. User gets `page_permissions PagePermission[]` and `comments Comment[]`.

Migration `004_collaboration`. No seed changes needed (demo workspace is
already private).

## 3. API contracts

Exactly `shared/contracts.md`. Re-summarized:
```
GET    /pages/:pageId/permissions          → 200 { permissions: PermissionDTO[] }
POST   /pages/:pageId/permissions          → 201 { permission: PermissionDTO }
DELETE /pages/:pageId/permissions/:permId  → 204
GET    /shared/:token                       → 200 { page, blocks }  (read-only)
GET    /pages/:pageId/comments             → 200 { comments: CommentDTO[] }
POST   /pages/:pageId/comments             → 201 { comment: CommentDTO }
PATCH  /comments/:commentId                → 200 { comment: CommentDTO }
DELETE /comments/:commentId                → 204
```

`PermissionDTO = { id, page_id, user_id?, share_type, access, inherit, token? }`
`CommentDTO = { id, block_id, page_id, user: UserDTO, body, resolved, created_at, updated_at }`

## 4. Frontend components
None (backend-only).

## 5. Libraries
No new libraries. Reuses Express, Prisma, zod. Socket.io deferred (documented gap).

## 6. Edge cases & error handling
- **Effective access:** resolve `accessForUser(pageId, userId)`:
  1. Workspace membership role → if OWNER/ADMIN/MEMBER, implicit EDITOR (or
     higher for OWNER).
  2. Walk up `parent_id` chain collecting `PagePermission` rows where
     `inherit=true` and `user_id=userId` (or `share_type=PUBLIC_LINK` for the
     token path) → take the highest access found.
  3. Combine: explicit page permission beats workspace role if stricter.
  4. No access → 403 (or 404 for the public path if token invalid).
- **Write gate:** mutating page/block operations require `EDITOR` or higher.
  `getAccessiblePage` gains an optional `minAccess` parameter.
- **Public link:** `GET /shared/:token` is a public route (no `requireAuth`);
  resolves the permission row by token, loads page + blocks read-only.
- **Comment authorship:** only the author or workspace OWNER can edit/delete a
  comment; any EDITOR+ can resolve.
- **Block deletion vs comments:** deleting a block does NOT cascade-delete
  comments (no FK to blocks); comments are retained with the orphaned `block_id`
  and hidden from UI (Task 0 §6 edge case).

## 7. Non-functional considerations
- Permission resolution walks up the ancestor chain (depth = page nesting depth).
  At typical nesting (5–10 levels) this is negligible; cache later if needed.
- Comments indexed on `page_id` and `block_id` for fast listing.

## 8. Deviations from constitution.md
None. Real-time (socket.io) is listed as optional in the constitution and the
master prompt; deferred with documentation per spec §3.

## 9. Resolution of spec open questions
- **Inheritance:** full ancestor walk collecting `inherit=true` permissions.
- **Viewer commenting:** VIEWER can comment (not a content mutation).
