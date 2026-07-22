# Tasks: 004 — Collaboration: permissions, sharing & comments

## Implementation
- [x] 1. Prisma: `ShareType`/`PageAccess` enums + `PagePermission` + `Comment`
      models; relation fields on `Page` and `User`. Migration `004_collaboration`.
- [x] 2. Upgraded `permissions.service.ts`: `resolveEffectiveAccess(pageId,
      userId)` composing workspace role + explicit permissions + ancestor
      inheritance. `getAccessiblePage` now takes optional `minAccess` param.
- [x] 3. Permissions module: dto, schema, service (list/create/delete + token
      generation), controller, routes behind `requireAuth` + OWNER.
- [x] 4. Public share route: `GET /shared/:token` (no auth) → page + blocks.
- [x] 5. Comments module: dto, schema, service (list/create/update/delete with
      authorship checks), controller, routes behind `requireAuth`.
- [x] 6. All routers wired into `app.ts`.
- [x] 7. Write-gate enforcement: all page/block mutations now require
      `minAccess: "EDITOR"`; permission management requires OWNER.

## Tests
- [x] Playwright API e2e (8 Task 4 tests + 31 prior = 39 total): permissions
      list/create-per-user/public-link/delete, invalid-token 404, per-user
      VIEWER read-yes/write-no, comments create+list/patch-resolve/delete.

## Verification gate
- [x] `yarn lint` — clean (0 errors, 0 warnings)
- [x] `yarn typecheck` — clean (frontend + backend + shared)
- [x] `yarn test:e2e` — 39 passed

## Docs
- [x] `specs/004-…/` spec/plan/tasks present.
- [x] Contracts unchanged in `/shared/contracts.md`.
- [x] Real-time (socket.io) documented as deferred (spec §3, plan §8).

## Notes / deviations
- **Write-gate enforcement**: the original Task 3 `getAccessiblePage` didn't
  enforce a minimum access level — any VIEWER could mutate. Task 4 added the
  `minAccess` parameter; all page/block mutation services now pass
  `minAccess: "EDITOR"`, and permission management requires `OWNER`.
- **Flaky multi-user test**: the per-user VIEWER test does a 4-step session
  switch (register Bob → logout → register Alice → grant → logout → login Bob).
  Under parallel workers, argon2's memory-hard hashing (19MiB) caused CPU
  contention and timeouts. Fixed by setting Playwright `workers: 1` — argon2
  is deliberately expensive, so parallel auth tests against one backend are
  inherently contended.
- **Real-time deferred**: socket.io presence/block sync is documented as a gap.
  The architecture (Task 0) and contracts support it; implementation is a
  follow-up.
