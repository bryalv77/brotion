# Tasks: Local guest mode (optional login, offline-capable)

> Derived from the approved plan. All tasks implemented in one pass; check
> marks reflect verified state.

## Implementation
- [x] Move the formula engine (`backend/src/modules/formulas/*`) and
      `applyViewConfig` into `@notion-clone/shared` so guest databases
      compute formula cells and view filtering identically to the server.
- [x] Local store: `frontend/lib/local/` — KV contract, IndexedDB adapter
      (web) + expo-sqlite adapter (native, via Metro platform files
      `kv.web.ts`/`kv.native.ts`), typed `LocalStore`, cuid2 id factory,
      first-run seed ("Personal" + Welcome; clean notebook for returning
      guests).
- [x] Session rework (`frontend/lib/session.ts`): `mode: guest | user`,
      offline-first boot (no network for new visitors), remembered-session
      flag, Reconnect path, merge-on-login tail, sign-out → guest.
- [x] Routes: `app/index.tsx` always enters the app; `(app)/_layout.tsx`
      drops the auth gate, seeds the guest notebook, renders the Reconnect
      screen when a remembered session is offline; login/register gain a
      "Continue without an account" escape hatch.
- [x] Repository seam `frontend/lib/data/*` mirroring every `lib/api/*`
      function the UI calls, with local implementations (pages, blocks,
      workspaces, databases incl. formulas/rollups/relations/templates,
      search, attachments, page-template stubs). UI imports swapped.
- [x] Backend `POST /me/adopt-local` (Express + Workers stacks): zod-
      validated snapshot, single transaction, FK-ordered creation, skip-if-
      -exists idempotency, unresolvable references dropped, search text
      rebuilt.
- [x] PWA: `public/manifest.webmanifest` + generated icons, `app/+html.tsx`
      (manifest/theme-color/headNodes/bodyNodes per SDK 58 custom-root
      contract), workbox precache in `scripts/prepare-pages.js`.

## Tests
- [x] Shared: formula engine (36) + applyViewConfig (8) unit tests moved
      with the code — `yarn workspace @notion-clone/shared test:unit`.
- [x] API e2e `adopt.spec.ts` (3 tests: 401, full adoption + idempotency +
      search, invalid type → 400) — `test:api` suite.
- [x] Web e2e: guest landing, local persistence across reload, merge-on-
      sign-in; login-wall test replaced.

## Verification gate
- [x] `yarn workspace frontend typecheck` / `backend typecheck` /
      `@notion-clone/shared typecheck` — clean.
- [x] `yarn test:api` — 108 passed (incl. 3 new).
- [x] `yarn test:e2e` (web) — 8 passed (incl. 3 new guest/merge tests).
- [x] Manual offline check of the static build: served `dist/` with a plain
      static server, created pages in guest mode, killed the server
      entirely, reloaded a deep `/page/:id` URL — the service worker served
      the shell and IndexedDB supplied the notebook (see screenshot artifact).
- [x] `yarn workspace frontend build:web` — export + sw.js generated,
      bundle scripts present in HTML.

## Docs
- [x] `specs/017-local-guest-mode/spec.md`.
- [x] Shared package exports `./formulas`; `AdoptLocal*` contract types in
      `shared/api-types.ts`.

## Notes / deviations found during implementation
- Custom `+html.tsx` in SDK 58 must render `useServerDocumentContext()`
  `headNodes`/`bodyNodes` or the exported HTML silently loses all bundle
  `<script defer>` tags (the default template injects them; there is no
  fallback for custom roots).
- Statically importing `expo-sqlite` anywhere reachable from the web bundle
  breaks `expo export --platform web` (unresolvable wasm asset); solved with
  Metro platform-specific adapter files.
- Guest seeding moved from session init into `(app)/_layout.tsx` so
  visiting /login alone creates no local data (keeps the demo account clean
  in e2e and avoids merging surprise notebooks).
