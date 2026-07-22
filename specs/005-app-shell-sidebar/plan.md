# Plan: 005 — Frontend: app shell & sidebar

> Technical design derived from spec.md. Respects `specs/constitution.md` (React
> + Vite + TS + Tailwind) and `specs/000-architecture/plan.md` §4 (component tree).

## 1. Architecture overview

```
<App>
  <QueryClientProvider>           (React Query — server cache)
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<LoginPage/>} />
        <Route path="/register"  element={<RegisterPage/>} />
        <Route path="/app" element={<RequireAuth><AppShell/></RequireAuth>}>
          <Route index           element={<Navigate to first workspace/>} />
          <Route path=":wsId"    element={<WorkspaceView/>} />
          <Route path=":wsId/:pageId" element={<PageViewStub/>} />
        </Route>
        <Route path="*" element={<Navigate to="/app"/>} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
</App>
```

**State split:**
- Zustand (`stores/session.ts`): `user`, `login()`, `logout()`, `fetchMe()`.
- Zustand (`stores/ui.ts`): sidebar collapsed, quick-search open.
- React Query: `useWorkspaces`, `useChildPages(parentId)`.

## 2. Folder structure (new files)

```
frontend/src/
├── main.tsx                      (exists — add QueryClientProvider + Router)
├── App.tsx                       (replace hello-world with routes)
├── api/
│   ├── client.ts                 (exists)
│   ├── auth.ts                   (register, login, logout, refresh, getMe)
│   ├── workspaces.ts             (list, create, get)
│   └── pages.ts                  (listChildren, create, get, patch)
├── stores/
│   ├── session.ts                (Zustand: user + auth actions)
│   └── ui.ts                     (Zustand: sidebar + search modal state)
├── hooks/
│   ├── useWorkspaces.ts          (RQ: list workspaces)
│   ├── useChildPages.ts          (RQ: list child pages)
│   └── useCreatePage.ts          (RQ mutation)
├── components/
│   ├── AppShell.tsx              (sidebar + <Outlet/>)
│   ├── RequireAuth.tsx           (route guard)
│   ├── Sidebar.tsx               (workspace switcher + tree + new page + search)
│   ├── WorkspaceSwitcher.tsx     (dropdown)
│   ├── PageTree.tsx              (recursive tree)
│   ├── PageTreeNode.tsx          (expand/collapse + link)
│   ├── QuickSearch.tsx           (Cmd/Ctrl+K modal stub)
│   └── ui/                       (Button, Input, Spinner — small primitives)
├── routes/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── WorkspaceView.tsx         (redirects to first page or shows empty state)
│   └── PageViewStub.tsx          (shows page title — Task 7 fills the editor)
└── lib/
    └── queryClient.ts            (React Query client config)
```

## 3. Data model
No new models. Consumes the Task 2–4 APIs via the typed `api/client.ts`.

## 4. Components (detailed)

### RequireAuth
- On mount, calls `fetchMe()`. If 401 → `<Navigate to="/login"/>`.
- While loading → spinner.
- If user → `<Outlet/>` (renders children).

### LoginPage / RegisterPage
- Form: email + password (+ name for register).
- On submit → call API → set session → `<Navigate to="/app"/>`.
- Error → display the message below the form.

### AppShell
- `<div flex>`: `<Sidebar/>` + `<main><Outlet/></main>`.
- Sidebar width fixed (240px), collapsible.

### Sidebar
- Top: `<WorkspaceSwitcher/>`.
- Middle: scrollable `<PageTree/>`.
- Bottom: "New page" button, search trigger.
- Cmd/Ctrl+K listener at this level.

### WorkspaceSwitcher
- Dropdown of workspaces from `useWorkspaces()`.
- Selecting navigates to `/app/:wsId`.

### PageTree / PageTreeNode
- Root: loads children of the workspace (parent_id=null).
- Each node: expand/collapse caret, icon, title link.
- Expanding lazily loads children via `useChildPages(node.id)`.
- "New page" creates under the selected parent.

### QuickSearch
- Modal overlay; input focused on open; closes on Escape.
- Stub: just the input (wired to search API in a refinement).

## 5. Libraries
| Concern | Choice | Why |
|--------|--------|-----|
| Routing | react-router-dom v6 | Constitution §2 |
| Server cache | @tanstack/react-query v5 | Task 0 plan §5 |
| UI state | zustand | Task 0 plan §5 |
| Forms | native (no form lib yet) | Keep it lean; add zod validation at the API boundary |

All within constitution. No deviation.

## 6. Edge cases
- **No workspaces:** WorkspaceView shows an empty state with a "Create workspace" CTA.
- **Auth race:** RequireAuth shows a spinner until `fetchMe` resolves, preventing
  route flicker.
- **Stale session:** API 401 → session store clears → redirect to login.
- **Deep link to a page:** the route guard + page fetch handle direct navigation.
- **Sidebar persistence:** collapsed state in localStorage via Zustand `persist`.

## 7. Non-functional
- Tailwind for all styling; no CSS files beyond `index.css`.
- Keyboard navigable (Tab through tree, Enter to open, Cmd/Ctrl+K for search).
- Responsive: sidebar hidden on small screens with a hamburger toggle (basic).

## 8. Deviations
None.

## 9. Resolution of open questions
- **State split:** Zustand (session + UI) + React Query (server cache).
- **Default workspace:** first in list; persist last-used in localStorage.
