# Spec: 005 — Frontend: app shell & sidebar

## 1. Summary
Build the application frame: a persistent sidebar (workspace switcher, page
tree with expand/collapse, quick-search trigger, "New page" button) alongside a
routed content area. Includes the auth flow (login/register pages, session
management, route guards) so a user can sign in and navigate their workspace.

## 2. Motivation / user stories
- As a visitor, I want to register / log in, so I can access my workspaces.
- As a logged-in user, I want to see a sidebar with my current workspace, so I
  can navigate my pages.
- As a user, I want to switch workspaces from the sidebar.
- As a user, I want to expand/collapse page tree nodes, so I can navigate
  nested pages.
- As a user, I want to create a new page from the sidebar.
- As a user, I want to press Cmd/Ctrl+K to open quick search.
- As a logged-out user, trying to access an app route should redirect to login.

## 3. Scope
### In scope
- react-router v6 routes: `/login`, `/register`, `/app` (protected), `/app/:wsId`
  (workspace view), `/app/:wsId/:pageId` (page view — stub for Task 7).
- Auth pages (login + register) with form validation + error display.
- Session store (Zustand): current user, login/logout actions.
- Route guard: unauthenticated → `/login`; authenticated on `/login` → `/app`.
- `AppShell` layout: sidebar + `<Outlet/>` content area.
- `Sidebar`: workspace switcher (dropdown), page tree (recursive, expand/collapse),
  "New page" button, quick-search trigger (Cmd/Ctrl+K opens a modal stub).
- API hooks: `useMe`, `useWorkspaces`, `useChildPages`.
- A "page view" stub that shows the page title (Task 7 fills in the editor).

### Out of scope
- The block editor (Task 6).
- Full page view with cover/icon/header (Task 7).
- Drag-and-drop reordering of the page tree.
- Real-time presence.

## 4. User-facing behavior
- `/login` and `/register` are public. On success → redirect to `/app`.
- `/app/*` requires a session; otherwise redirect to `/login`.
- The sidebar loads the user's workspaces; the first workspace is selected by
  default. Switching workspaces navigates to `/app/:wsId`.
- The page tree loads children of the workspace root; clicking a node navigates
  to `/app/:wsId/:pageId` and lazily loads its children (expand on click).
- "New page" creates a page under the current workspace root (or the selected
  parent) and navigates to it.
- Cmd/Ctrl+K opens a search modal stub (input only; wired to the search API in
  a later refinement — for now it shows the input and focuses it).

## 5. Dependencies
- Depends on: `000-architecture` (component tree), Tasks 1–4 (backend APIs).
- Depended on by: Task 6 (editor lives inside the page view), Task 7 (page
  header/cover/icon), Task 8 (a11y, responsive).

## 6. Acceptance criteria
- [ ] `/login` with valid credentials → redirects to `/app`.
- [ ] `/login` with wrong credentials → shows error message.
- [ ] `/register` creates account → redirects to `/app`.
- [ ] Unauthenticated visit to `/app` → redirects to `/login`.
- [ ] Sidebar renders the workspace name + page tree.
- [ ] Switching workspaces updates the tree.
- [ ] Expanding a page node loads + shows its children.
- [ ] "New page" creates a page and navigates to it.
- [ ] Cmd/Ctrl+K opens the quick-search modal.
- [ ] Logout clears session and returns to `/login`.

## 7. Open questions
- State management split: Zustand for UI/session, React Query for server cache.
  → plan: yes, that split; RQ for workspaces/pages, Zustand for session + UI
  flags (sidebar collapsed, selected workspace).
- Default workspace selection: first in list. → plan: yes, persist last-used
  workspace id in localStorage for returning users.
