# Tasks: 005 — Frontend: app shell & sidebar

## Implementation
- [ ] 1. Install deps: react-router-dom, @tanstack/react-query, zustand.
- [ ] 2. API modules: `api/auth.ts`, `api/workspaces.ts`, `api/pages.ts`.
- [ ] 3. Stores: `stores/session.ts` (user + auth), `stores/ui.ts` (sidebar +
       search modal).
- [ ] 4. React Query client + provider in `main.tsx`.
- [ ] 5. Routes + `App.tsx` rewrite (login/register/app routes).
- [ ] 6. `RequireAuth` guard.
- [ ] 7. `LoginPage` + `RegisterPage`.
- [ ] 8. `AppShell` layout.
- [ ] 9. `Sidebar` + `WorkspaceSwitcher`.
- [ ] 10. `PageTree` + `PageTreeNode` (recursive, lazy-load children).
- [ ] 11. `QuickSearch` modal stub (Cmd/Ctrl+K).
- [ ] 12. `WorkspaceView` + `PageViewStub`.

## Tests
- [ ] Playwright e2e: register → app loads, sidebar renders, page tree works,
       new page, Cmd+K search, logout.

## Verification gate
- [ ] `yarn lint` — clean
- [ ] `yarn typecheck` — clean
- [ ] `yarn test:e2e` — all pass

## Docs
- [x] `specs/005-…/` spec/plan/tasks present.

## Notes / deviations
- (to be filled)
