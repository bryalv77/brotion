# Tasks: 003 — Workspaces, pages, blocks, search & uploads

> Derived from plan.md. Implement bottom-up: models → permissions → modules → tests.

## Implementation
- [x] 1. Prisma: `WorkspaceRole`/`BlockType` enums + `Workspace`,
      `WorkspaceMember`, `Page`, `Block`, `Attachment` models; relation fields
      on `User`. Migration `20260722020000_workspaces_pages_blocks`.
- [x] 2. Search SQL: `pages.search_vector` generated tsvector + GIN index
      (raw SQL migration step; Prisma can't declare generated columns).
- [x] 3. Seed: demo workspace "My Workspace" (owned by demo user) + "Welcome"
      page with one paragraph block.
- [x] 4. Permissions service: `assertWorkspaceMember`, `getAccessibleWorkspace`,
      `getAccessiblePage`, `isOwner`.
- [x] 5. Workspaces module: dto, service (list/create/get with role),
      controller, routes. Creator becomes OWNER.
- [x] 6. Pages module: dto, service (children/create/get-with-blocks/patch/
      trash/permanent-delete/restore/duplicate), controller, routes. Cycle guard
      on reparent. content_text maintained on block writes.
- [x] 7. Blocks module: dto, `order` math (compute/renormalize), service
      (create/list/patch/delete/reorder with cycle guard), controller, routes.
- [x] 8. Search module: raw `tsquery` via Prisma `$queryRaw`, returns ranked
      results with snippets. Route `GET /workspaces/:id/search`.
- [x] 9. Files module: multer v2 (memory → disk write under `storage/`),
      extension+size validation, `Attachment` row, `POST /files` + `GET /files/:key`.
- [x] 10. All routers wired into `app.ts` under `/api/v1`.

## Tests
- [x] Playwright API e2e covering every acceptance criterion (18 Task 3 tests +
      12 auth + 1 smoke = 31 total): workspace create/list/get/403, page
      CRUD+tree+trash/restore+duplicate, block create(before/after)/reorder/
      patch/delete/cycle-400, search find+empty-400, upload ok/413/400-wrong-type.

## Verification gate
- [x] `yarn lint` — clean (0 errors, 0 warnings)
- [x] `yarn typecheck` — clean (frontend + backend + shared)
- [x] `yarn test:e2e` — 31 passed

## Docs
- [x] `specs/003-…/` spec/plan/tasks present.
- [x] Contracts unchanged in `/shared/contracts.md`.

## Notes / deviations found during implementation
- **Missing `requireAuth` on all Task 3 routes** (root cause of first test run's
  18 failures): every new router (workspaces, pages, blocks, search, files) was
  missing `requireAuth` middleware, so `req.user` was undefined → 500 on every
  request. Fixed by adding `router.use(requireAuth)` to each.
- **Express `mergeParams`** (second root cause): sub-routers mounted with
  `app.use("/workspaces/:workspaceId/pages", router)` don't inherit `:workspaceId`
  from the mount path unless created with `Router({ mergeParams: true })`. Fixed
  on `workspacePagesRouter`, `pageBlocksRouter`, `searchRouter`.
- **Multer error → envelope**: multer's `LIMIT_FILE_SIZE` error is a plain
  `MulterError`, not an `ApiError`, so it fell through to the 500 path. Fixed by
  mapping it to `new ApiError(413, "TOO_LARGE", ...)` in the route's error adapter.
- **`computeOrder` anchor semantics**: `before_id` = the block the new one goes
  BEFORE (higher order), `after_id` = the block it goes AFTER (lower order). The
  validation must check `after.order >= before.order` (not the reverse). Initial
  implementation had the comparison inverted, causing all anchored inserts to 400.
- **multer v2**: upgraded from 1.x (security vulnerabilities) to 2.0; required a
  type cast at the multer/express boundary due to `@types/multer` bundling its
  own `@types/express-serve-static-core`.
- **`@types/multer` ↔ express type conflict**: cast `req`/`res` through
  `unknown` at the multer callback boundary; runtime is unaffected.
