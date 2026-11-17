# Spec: Local guest mode (optional login, offline-capable)

## 1. Summary
The app opens straight into a working notebook without an account and works
fully offline. All notes are saved on the device (IndexedDB on web, SQLite on
native). Creating an account or signing in is an optional upgrade that
uploads ("adopts") the local notes into the account and switches to
server-synced data.

## 2. Motivation / user stories
- As a visitor, I want to start writing immediately without signing up, so
  that there is zero friction to trying the app.
- As a guest, I want my notes kept on my device and available offline, so
  that the app behaves like a local notebook (and like an installable app
  on the web).
- As a guest who is sold, I want to sign in/create an account and keep
  everything I wrote locally, so that upgrading never costs me my notes.
- As a signed-in user whose connection dropped at startup, I want a clear
  choice between retrying or working locally, so that I am never silently
  signed out or blocked.

## 3. Scope
### In scope
- Guest mode: workspaces, page tree, block editor, trash/restore/permanent
  delete, move/reparent, breadcrumbs, search, databases (properties, rows,
  views, formulas via the shared engine, templates), all served from a local
  store with API-identical DTO shapes.
- Merge-on-login: `POST /me/adopt-local` uploads the local snapshot with
  client-generated ids preserved; idempotent; signed-out guests get a clean
  notebook afterwards.
- PWA: web manifest, icons, workbox precache service worker (production
  builds only) so the shell boots offline.
- Offline boot handling for remembered sessions (Reconnect screen with
  "Use local notebook" fallback).

### Out of scope (explicitly deferred to another task)
- Offline editing for signed-in users (outbox sync, conflict resolution).
- Image/file attachments in guest mode (upload requires the API).
- Server-side page-template instantiation in guest mode (factory is
  server-side); the gallery list renders but instantiation is rejected.
- Selective/per-workbook sync controls.

## 4. User-facing behavior
- First visit (web or native): app opens directly on a seeded "Personal"
  workspace with a Welcome page. No login wall. Sidebar shows "Sign in to
  sync" with a note that notes are saved on this device.
- All CRUD works with no network. On web, data lives in IndexedDB
  (`nc-local`); on native in SQLite (`nc-local.db`).
- Visiting only /login or /register does NOT create local data; signing in
  from a fresh browser merges nothing.
- Sign in / sign up from guest mode: local notebook is uploaded first
  (failure keeps the local data, shows a toast, retries next sign-in), then
  the app switches to server data. Sign out returns to guest mode with a
  clean empty notebook (no repeat of first-run welcome content).
- Boot with a remembered session but unreachable server: Reconnect screen
  (Retry / Use local notebook). Local edits made that way are adopted at the
  next successful sign-in.
- Installed PWA (web): app shell loads offline via service worker; guest
  data comes from IndexedDB.

## 5. Dependencies
- Depends on specs: 002 (auth), 003 (workspaces/pages/blocks), 012/014
  (databases), 013 (sheets/formulas), 016 (templates).
- Shared packages: formula engine + applyViewConfig moved to
  `@notion-clone/shared` so client and server compute identically.

## 6. Acceptance criteria (must be testable 1:1 by e2e tests)
- [x] Visitor with no account lands on a working notebook (URL `/page/…`,
      "Personal" + Welcome visible), no redirect to `/login`.
- [x] Guest page creation persists across reload with no backend session.
- [x] Signing in from guest mode uploads the local "Personal" workspace
      into the account (visible via `GET /workspaces` after sign-in).
- [x] `POST /me/adopt-local` adopts a snapshot with ids preserved (pages,
      blocks, databases, values readable through the normal API), is
      idempotent (re-adopt adopts 0), and rebuilds search text.
- [x] Unauthenticated adopt → 401; malformed payload (unknown block type)
      → 400 with nothing persisted.
- [x] Direct `/login` visit creates no local data (demo sign-in tests
      unchanged, demo account unpolluted).

## 7. Open questions
- Offline editing for signed-in users (outbox + conflict policy) — future
  spec.
- Attachment/blob caching for offline image rendering — future spec.
