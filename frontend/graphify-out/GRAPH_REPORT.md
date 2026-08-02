# Graph Report - frontend  (2026-08-02)

## Corpus Check
- 84 files · ~31,302 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 780 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c83b927b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- request
- e2e/helpers.ts
- dependencies
- pages.ts
- Editor.tsx
- App.tsx
- devDependencies
- parser.ts
- compilerOptions
- PageView.tsx
- Parser
- ErrorBoundary
- SlashMenu.tsx
- global-setup.ts
- playwright.config.ts
- ui.spec.ts

## God Nodes (most connected - your core abstractions)
1. `request()` - 43 edges
2. `Parser` - 14 edges
3. `register()` - 13 edges
4. `makeWorkspace()` - 12 edges
5. `useToast` - 11 edges
6. `colorFor()` - 10 edges
7. `uniqueEmail()` - 10 edges
8. `DatabaseView()` - 9 edges
9. `TableView()` - 9 edges
10. `useSession` - 9 edges

## Surprising Connections (you probably didn't know these)
- `createWorkspace()` --calls--> `request()`  [EXTRACTED]
  src/api/workspaces.ts → src/api/client.ts
- `getWorkspace()` --calls--> `request()`  [EXTRACTED]
  src/api/workspaces.ts → src/api/client.ts
- `WorkspaceIndex()` --calls--> `useWorkspaces()`  [EXTRACTED]
  src/App.tsx → src/hooks/useWorkspaces.ts
- `listAttachments()` --calls--> `request()`  [EXTRACTED]
  src/api/attachments.ts → src/api/client.ts
- `getMe()` --calls--> `request()`  [EXTRACTED]
  src/api/auth.ts → src/api/client.ts

## Import Cycles
- None detected.

## Communities (23 total, 4 thin omitted)

### Community 0 - "request"
Cohesion: 0.08
Nodes (48): getMe(), login(), logout(), refresh(), register(), request(), addProperty(), addRow() (+40 more)

### Community 1 - "e2e/helpers.ts"
Cohesion: 0.10
Nodes (19): DbShape, loginAndCreatePage(), createFreshPageInFirstWorkspace(), CSRF_HEADER, HEADERS, JSON_HEADERS, login(), makeBlock() (+11 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (43): lowlight, @notion-clone/shared, dependencies, lowlight, @notion-clone/shared, react, react-dom, react-router-dom (+35 more)

### Community 3 - "pages.ts"
Cohesion: 0.11
Nodes (25): ApiClientError, importFile(), createPage(), deletePage(), listChildPages(), listTrashedPages(), movePage(), permanentDeletePage() (+17 more)

### Community 4 - "Editor.tsx"
Cohesion: 0.09
Nodes (29): createBlock(), deleteBlock(), updateBlock(), createDatabase(), uploadImage(), Editor(), EditorProps, lowlight (+21 more)

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (21): createWorkspace(), getWorkspace(), listWorkspaces(), WorkspaceIndex(), AppShell(), QuickSearch(), RequireAuth(), Sidebar() (+13 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (33): autoprefixer, devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/node, @types/react (+25 more)

### Community 7 - "parser.ts"
Cohesion: 0.10
Nodes (25): AGGREGATION_FUNCTIONS, AstNode, cmp(), ComputedCell, ComputedCellStatus, evalArg(), evalBinary(), EvalContext (+17 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, playwright.config.ts, src, tests, ../tsconfig.base.json (+12 more)

### Community 9 - "PageView.tsx"
Cohesion: 0.16
Nodes (13): AttachmentInfo, listAttachments(), getPage(), getPageBreadcrumbs(), Breadcrumbs(), fileIcon(), FileRow(), formatSize() (+5 more)

### Community 11 - "ErrorBoundary"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, queryClient

### Community 12 - "SlashMenu.tsx"
Cohesion: 0.40
Nodes (5): getFiltered(), ITEMS, MenuItem, SlashMenu(), SlashMenuProps

## Knowledge Gaps
- **102 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `request()` connect `request` to `PageView.tsx`, `pages.ts`, `Editor.tsx`, `App.tsx`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `useToast` connect `pages.ts` to `Editor.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Parser` connect `Parser` to `parser.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `request` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `e2e/helpers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10338164251207729 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._