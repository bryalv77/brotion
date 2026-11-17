# Optional login / offline-first guest mode

## Context

Today the app is unusable without an account and a live backend: every backend router enforces `requireAuth`, and the frontend hard-gates the `(app)` group behind a session (`frontend/app/index.tsx` redirects to `/login`; `frontend/app/(app)/_layout.tsx:8` bounces to `/login` when `user` is null). There is zero offline support — no service worker, no PWA manifest, no local DB; React Query cache is memory-only and a network failure at boot (`frontend/lib/session.ts:24-37`) is treated as "logged out".

**Goal:** the app opens straight into a working local workspace (no account), fully usable offline on web (installable PWA, IndexedDB) and native (SQLite). Login becomes an optional upgrade that **merges** the guest's local notes into their account. Logged-in offline sync is explicitly out of scope this iteration (future phase).

**Key architectural insight from exploration:** guests never touch the backend at all — guest mode is purely client-side, so no guest accounts/nullable FKs are needed server-side. The UI funnels all data through ~40 functions in `frontend/lib/api/*` with DTO shapes from `shared/api-types.ts`; swapping that seam lets every screen work unchanged in both modes.

## Architecture

- **Data mode** in the session store: `guest` (local store is source of truth) vs `user` (existing API). Persisted via the existing `zustandStorage`.
- **Repository seam** `frontend/lib/data/` mirroring the `lib/api/*` function signatures; delegates to Local (guest) or Remote (user). Screens/hooks change imports only.
- **Local store** stores DTOs verbatim as JSON: IndexedDB (`idb`) on web, `expo-sqlite` on native (`entities(type,id,json)` table, filtering in JS — personal-note scale).
- **Client-generated IDs** (`@paralleldrive/cuid2`) for all local entities, preserved verbatim on merge (server accepts provided IDs — no remapping). This fulfills the `specs/000-architecture/plan.md` intent of app-layer IDs.
- **Formula engine moves to shared**: `backend/src/modules/formulas/*.ts` (~1,200 lines, pure TS) → `shared/formulas/`, so local databases can compute `computed` cells; backend imports it from `@notion-clone/shared` (behavior unchanged).

## Implementation steps

### 1. Foundations
- Move formula engine (`lexer/tokens/ast/parser/evaluator/functions/engine` + tests) `backend/src/modules/formulas/` → `shared/formulas/`; re-export from `shared/index.ts`; update backend imports. Add `shared/formulas` export to the workspace package.
- Add deps to `frontend/package.json`: `expo-sqlite`, `idb`, `@paralleldrive/cuid2` (devDep `workbox-build`).
- New `frontend/lib/local/`:
  - `store.ts` — `LocalStore` interface (get/put/delete/list per entity: workspaces, pages, blocks, databases; plus `meta` for mode/seed flags and `clear()`).
  - `idb.ts` (web adapter, DB `nc-local`) / `sqlite.ts` (native adapter).
  - `ids.ts` — cuid2 wrapper.
  - `seed.ts` — creates local "Personal" workspace + a welcome page with a few blocks (mirror demo seed, simplified) on first guest boot.

### 2. Session & routing (remove the login wall)
- `frontend/lib/session.ts`: add persisted `mode: 'guest' | 'user'`; first run defaults to `guest`. `initialize()` never blocks on network: 401 → guest mode (clear stale tokens); **network error with remembered `user` session** → keep `user` and show a small Reconnect screen (Retry / "Continue locally" → guest). `signIn`/`signUp` trigger merge (step 4) when local guest data exists, then switch to `user`. `signOut` → guest mode.
- `frontend/app/index.tsx`: always redirect to `/(app)/`.
- `frontend/app/(app)/_layout.tsx`: drop the `!user` gate.
- `frontend/components/WorkspaceSwitcher.tsx`: guest state shows "Sign in to sync" (→ `/login`); user state unchanged. Add a subtle "Saved on this device" indicator for guests.

### 3. Repository layer + UI wiring
- New `frontend/lib/data/` re-exporting/mirroring `lib/api/*` signatures: `workspaces`, `pages`, `blocks`, `databases`, `page-templates`, `attachments`, `search`, with local implementations for guest mode (same DTO shapes). `attachments.listAttachments` → `[]`; `search` = title/text filter over local pages; databases: rows/views/templates CRUD over local JSON, `computed` via shared formula engine.
- Swap imports `lib/api/*` → `lib/data/*` in: `frontend/hooks/*`, `frontend/features/editor/Editor.tsx` + `useBlockSync.ts`, `frontend/features/**`, `frontend/components/**` (incl. `QuickSearch.tsx`, which currently calls `request` directly — route through `lib/data/search`). No logic changes needed: editor debounce/temp-id reconciliation is already client-side.
- `frontend/lib/queryClient.ts`: in guest mode skip retries/network-status noise (queries resolve from local layer synchronously).

### 4. Merge-on-login ("adopt local data")
- Backend: new route `POST /api/v1/me/adopt-local` (`requireAuth`) in a module router (auto-mounted by both Express `app.ts` and Workers `backend/src/workers/app.ts` — verify mounting). Body: snapshot `{ workspaces: [{ workspace, pages: [{ page, blocks, databases }] }] }`. Service creates everything in one transaction preserving client IDs, `created_by` = authenticated user, plus `WorkspaceMember` rows. Guest workspaces land as new workspaces in the account.
- Frontend `frontend/lib/merge.ts`: read local store → build snapshot → POST → on success clear local store, set mode `user`, invalidate all queries. Wire into `signIn`/`signUp` before redirect.

### 5. PWA / offline shell (web)
- New `frontend/app/+html.tsx`: inject `<link rel="manifest">`, theme-color, apple-touch-icon; register `sw.js` (web only).
- New `frontend/public/manifest.webmanifest` + icons (192/512 + maskable, generated from the app icon).
- Extend `frontend/scripts/prepare-pages.js`: run `workbox-build.generateSW` over `dist/` to precache the static export into `dist/sw.js`. Result: app shell boots offline; guest data loads from IndexedDB. Native needs nothing extra (SQLite + local assets).

### 6. Tests & docs
- New spec `specs/017-local-guest-mode/` following `specs/_templates` convention.
- Update `frontend/tests/e2e-web/app.spec.ts`: "unauthenticated visitor is redirected to login" → lands in guest workspace; add: guest creates a page → reload → persists; sign-in from guest → notes present in account.
- Add API test (in `frontend/legacy-web/tests/e2e` API suite style): register → `adopt-local` → verify pages/workspace exist.
- Unit tests: local repository CRUD, merge snapshot builder, formula engine tests moved with the code.

## Key files
**New:** `frontend/lib/local/{store,idb,sqlite,ids,seed}.ts`, `frontend/lib/data/*.ts`, `frontend/lib/merge.ts`, `frontend/app/+html.tsx`, `frontend/public/manifest.webmanifest`, `shared/formulas/*` (moved), `specs/017-local-guest-mode/`
**Modified:** `frontend/lib/session.ts`, `frontend/app/index.tsx`, `frontend/app/(app)/_layout.tsx`, `frontend/components/WorkspaceSwitcher.tsx`, `frontend/scripts/prepare-pages.js`, `frontend/lib/queryClient.ts`, `frontend/package.json`, `shared/index.ts`, `backend/src/modules/formulas` imports (moved out), backend adopt route/service, e2e tests.

## Verification
1. `yarn workspace frontend typecheck`; unit + `yarn test:api`; `yarn test:e2e`.
2. Web guest/offline: `yarn dev` → open app → straight into "Personal" workspace, no login. Stop the backend → create/edit pages, add blocks, create a database — all works; DevTools → IndexedDB `nc-local` shows entities; reload with backend still down → data intact.
3. Merge: sign in from guest state → local workspaces appear in the account; local store cleared; reload → server-backed.
4. PWA: `yarn workspace frontend build:web && npx wrangler pages dev dist` → installable, then kill network and reload → app boots and edits work.
5. Native: `yarn workspace frontend ios` (or android) with API unreachable → full guest flow works via SQLite.
6. After implementation: run `graphify update .` (per AGENTS.md).