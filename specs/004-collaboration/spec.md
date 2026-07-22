# Spec: 004 — Collaboration: permissions, sharing & comments

## 1. Summary
Add page-level permissions (per-user and public-link sharing) and per-block
comments. A page owner can grant EDITOR/VIEWER access to specific users or
generate a public share link; any permitted viewer can read the page via
`/shared/:token`. Comments attach to a block and can be resolved.

## 2. Motivation / user stories
- As a page owner, I want to share a page with a specific user as editor or viewer.
- As a page owner, I want to generate a public link so anyone with the link can view.
- As a shared viewer, I want to read a page via its share token without being a
  workspace member.
- As a permitted user, I want to comment on a block.
- As a comment author, I want to edit/resolve/delete my comments.
- As a viewer, I should NOT be able to edit a page I only have VIEWER access to.

## 3. Scope
### In scope
- `PagePermission` + `Comment` Prisma models.
- Effective-access resolution: workspace role ∪ explicit page permissions ∪
  inheritance from ancestor pages.
- `GET/POST/DELETE /pages/:id/permissions`.
- `GET /shared/:token` (public read-only page by link token).
- `GET/POST /pages/:id/comments`, `PATCH/DELETE /comments/:id`.
- Write-gate: EDITOR+ for mutating page/block ops; VIEWER is read-only.

### Out of scope
- Real-time (socket.io presence/block sync): **deferred** — documented as a gap.
  The architecture and contracts support it; implementation is a follow-up.
- Email notifications for shares/comments.
- @mentions resolution beyond storing the mention ref.

## 4. Developer-facing behavior
- `POST /pages/:id/permissions` with `{ user_id, access: "EDITOR"|"VIEWER" }`
  grants per-user access. `{ share_type: "PUBLIC_LINK", access: "VIEWER" }`
  generates an opaque token.
- Inheritance: a permission with `inherit: true` (default) applies to all
  descendant pages.
- `GET /shared/:token` returns the page + blocks in read-only shape (no
  edit endpoints accept the token).
- Comments belong to a block (`block_id`) but are denormalized with `page_id`
  for fast "all comments on page" queries.
- Comment access: any user who can READ the page can read comments; only the
  comment author (or OWNER) can edit/delete; any EDITOR+ can resolve.

## 5. Dependencies
- Depends on: `000-architecture`, `001-setup`, `002-auth`, `003-workspaces-pages-blocks`.
- Depended on by: Tasks 5–7 (frontend consumes permissions + comments).

## 6. Acceptance criteria
- [ ] Grant per-user VIEWER access; that user can GET the page but not PATCH it.
- [ ] Generate a public link; `GET /shared/:token` returns the page + blocks.
- [ ] Invalid/expired token → 404.
- [ ] Non-permitted user without membership → 403 on page GET.
- [ ] List a page's permissions (`GET /pages/:id/permissions`).
- [ ] Delete a permission (`DELETE /pages/:id/permissions/:permId`).
- [ ] Create a comment on a block (`POST /pages/:id/comments`).
- [ ] List comments on a page (`GET /pages/:id/comments`).
- [ ] Patch a comment (edit body / resolve).
- [ ] Delete a comment; only the author or owner can delete.

## 7. Open questions
- Inheritance traversal depth: full ancestor walk vs. one level. → plan: walk
  up `parent_id` collecting all inherited permissions; cache later if needed.
- Can a viewer comment? → plan: yes — VIEWER can read + comment (commenting is
  not a content mutation), but cannot edit blocks.
