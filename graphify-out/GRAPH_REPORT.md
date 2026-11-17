# Graph Report - notion-clone  (2026-11-17)

## Corpus Check
- 391 files · ~147,722 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 37 file(s) not represented in the graph (top: .sqlite 7, .sqlite-shm 7, .sqlite-wal 7)

## Summary
- 2161 nodes · 5419 edges · 118 communities (86 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.89)
- Token cost: 0 input · 297,143 output

## Graph Freshness
- Built from commit: `82138fd0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.service.ts
- src/components/DatabaseView.tsx
- features/formulas/parser.ts
- backend/package.json
- block-schema.ts
- frontend/package.json
- scripts
- app.ts
- Plan: Sheets & Formulas
- dependencies
- api-types.ts
- devDependencies
- engine.ts
- BlockDTO
- blocks.service.ts
- getPrisma
- Plan: 005 — Frontend app shell & sidebar
- compilerOptions
- compilerOptions
- Spec: 004 — Collaboration (permissions, sharing & comments)
- registry/types.ts
- @tanstack/react-query
- postgres
- shared/package.json
- Plan 003 — Workspaces, Pages, Blocks, Search & Uploads
- request
- getAccessiblePage
- compilerOptions
- markdown.ts
- compilerOptions
- docx.ts
- prisma/client.ts
- Plan 000 — Architecture & Contracts
- HEADERS
- lib/api/client.ts
- frontend/components/WorkspaceSwitcher.tsx
- Plan 002 — Authentication & Users
- templates.spec.ts
- register
- react
- Master Prompt: Notion Clone
- frontend/features/editor/Editor.tsx
- App.tsx
- Notion Clone Root README
- Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)
- export.service.ts
- routes/workspaces.ts
- PageHeader.tsx
- lib/session.ts
- frontend/components/db/CellEditor.tsx
- LocalStore
- @tanstack/react-query
- Spec: 016 — Database Templates
- local/databases.ts
- scripts
- Plan: 009 — Dark mode + full-height sidebar
- src/components/PageTree.tsx
- src/api/pages.ts
- src/api/databases.ts
- prepare-pages.js
- sheets.spec.ts
- src/components/db/CellEditor.tsx
- expo
- request
- src/features/editor/Editor.tsx
- dependencies
- release-ios.mjs
- DatabaseDTO
- TemplateCard.tsx
- PageView.tsx
- PermissionDTO
- src/components/Sidebar.tsx
- frontend/stores/theme.ts
- ErrorBoundary
- adopt.service.ts
- Real-time Socket.io Events
- Tasks: 005 — Frontend app shell & sidebar
- Tasks: 006 — Frontend block editor (TipTap)
- Tasks: 007 — Page view header, cover & icon
- Tasks: 008 — QA pass
- Tasks: 009 — Dark mode + full-height sidebar
- Spec: 014 — Databases v2 (Notion-style)
- secureStore.web.ts
- Databases — full Notion-style build-out
- misc.ts
- scripts
- auth.service.ts
- AGENTS.md
- @playwright/test
- TemplateDTO
- expo-linking@*
- KV
- uploads.ts
- Implementation steps
- databases.spec.ts
- metro.config.js
- generate-icons.mjs
- Spec: Local guest mode (optional login, offline-capable)
- @expo/metro-runtime@*
- expo-secure-store
- expo-sharing@*
- server.ts
- expo-status-bar
- app.spec.ts
- Tasks: Local guest mode (optional login, offline-capable)
- Tasks: 016 — Database Templates
- @paralleldrive/cuid2
- react-dom
- react-native-gesture-handler@~3.3.0
- react-native-web@0.21.4
- tailwindcss

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 103 edges
2. `getAccessiblePage()` - 55 edges
3. `request()` - 52 edges
4. `request()` - 51 edges
5. `getLocalStore()` - 51 edges
6. `react` - 47 edges
7. `@tanstack/react-query` - 46 edges
8. `notFound()` - 39 edges
9. `LocalStore` - 36 edges
10. `badRequest()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Slice 4 — Backend: rutas, controladores, schemas` --references--> `getAccessiblePage()`  [INFERRED]
  .zcode/plans/plan-sess_85cc6034-8944-4b32-bf93-84cc9a07a210.md → backend/src/modules/auth/permissions.service.ts
- `Backend` --references--> `moveView()`  [INFERRED]
  .zcode/plans/plan-sess_02cc782c-10a7-49bb-ab48-7a4401f856a1.md → backend/src/modules/databases/databases.service.ts
- `Backend` --references--> `getPageWithBlocks()`  [INFERRED]
  .zcode/plans/plan-sess_02cc782c-10a7-49bb-ab48-7a4401f856a1.md → backend/src/modules/pages/pages.service.ts
- `Slice 5 — Exclusión de la Page oculta (3 puntos)` --references--> `getPageAncestors()`  [INFERRED]
  .zcode/plans/plan-sess_85cc6034-8944-4b32-bf93-84cc9a07a210.md → backend/src/modules/pages/pages.service.ts
- `1. Foundations` --references--> `LocalStore`  [INFERRED]
  .zcode/plans/plan-sess_12cf5042-4ec7-4f4b-ace6-5561e4a678be.md → frontend/lib/local/store.ts

## Import Cycles
- 2-file cycle: `shared/applyViewConfig.ts -> shared/index.ts -> shared/applyViewConfig.ts`

## Hyperedges (group relationships)
- **App shell navigation component group** — specs_005_app_shell_sidebar_plan_appshell, specs_005_app_shell_sidebar_plan_sidebar, specs_005_app_shell_sidebar_plan_pagetree, specs_005_app_shell_sidebar_plan_workspaceswitcher, specs_005_app_shell_sidebar_plan_requireauth [EXTRACTED 1.00]
- **Task 0 Architecture Deliverable Bundle (spec/plan/tasks + downstream contracts/docs/ADR)** — specs_000_architecture_spec_doc, specs_000_architecture_plan_doc, specs_000_architecture_tasks_doc, shared_contracts_doc, docs_architecture_doc, docs_adr_0001_editor_library_tiptap [EXTRACTED 1.00]
- **Database–Property–PropertyValue data model reused across specs 012 and 013-sheets-and-formulas** — specs_012_databases_plan_database_model, specs_012_databases_plan_property_model, specs_012_databases_plan_propertyvalue_model, specs_013_sheets_and_formulas_plan [EXTRACTED 1.00]
- **Block-Editor Library Candidates Evaluated in ADR 0001** — docs_adr_0001_editor_library_tiptap, docs_adr_0001_editor_library_slatejs, docs_adr_0001_editor_library_custom_contenteditable, docs_adr_0001_editor_library_lexical [EXTRACTED 1.00]
- **Mandatory yarn lint/typecheck/test:e2e verification gate applied across features** — specs_constitution_verification_gate, specs_011_tables_tasks, specs_012_databases_tasks, specs_013_export_tasks, specs_013_sheets_and_formulas_tasks [EXTRACTED 1.00]
- **Master Prompt Sequential Task Dependency Chain (Task 0 → Task 8)** — notion_clone_subagent_prompt_task0_architect, notion_clone_subagent_prompt_task1_setup, notion_clone_subagent_prompt_task2_auth, notion_clone_subagent_prompt_task3_data_layer, notion_clone_subagent_prompt_task4_permissions, notion_clone_subagent_prompt_task5_app_shell, notion_clone_subagent_prompt_task6_block_editor, notion_clone_subagent_prompt_task7_page_view, notion_clone_subagent_prompt_task8_qa [EXTRACTED 1.00]
- **Zustand persisted client-state stores (session, ui, theme)** — specs_005_app_shell_sidebar_plan_session_store, specs_005_app_shell_sidebar_plan_ui_store, specs_009_dark_mode_plan_theme_store [INFERRED 0.75]
- **Slash-menu-triggered content insertion pattern (table / database / image)** — specs_011_tables_plan, specs_013_sheets_and_formulas_plan, specs_014_image_uploads_spec [INFERRED 0.80]
- **Page access control flow: permissions, effective access, write gate, public share** — specs_004_collaboration_plan_pagepermission_model, specs_004_collaboration_plan_effective_access_resolution, specs_004_collaboration_plan_write_gate, specs_004_collaboration_spec_public_share_route [INFERRED 0.85]

## Communities (118 total, 32 thin omitted)

### Community 0 - "pages.service.ts"
Cohesion: 0.14
Nodes (32): assertWorkspaceMember(), createBlockTree(), instantiatePageTemplate(), isRelationValue(), resolveBlockContent(), findPageTemplate(), toPageDTO(), toPageSummaryDTO() (+24 more)

### Community 1 - "src/components/DatabaseView.tsx"
Cohesion: 0.19
Nodes (15): createView(), deleteDatabase(), listPageDatabases(), updatePropertyValue(), updateView(), cap(), DatabaseView(), DatabaseViewProps (+7 more)

### Community 2 - "features/formulas/parser.ts"
Cohesion: 0.10
Nodes (28): AGGREGATION_FUNCTIONS, AstNode, cmp(), ComputedCell, ComputedCellStatus, evalArg(), evalBinary(), EvalContext (+20 more)

### Community 3 - "backend/package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @cloudflare/workers-types@^5.20261116.1, pino-pretty@^11.3.0, prisma@^5.22.0, tsx@^4.19.2, @types/markdown-it@^14.1.2, @types/node@^22.9.0, typescript@^5.6.3 (+16 more)

### Community 4 - "block-schema.ts"
Cohesion: 0.20
Nodes (14): RichText, CalloutContent, CodeContent, DividerContent, HeadingContent, ImageContent, ListContent, PageRefContent (+6 more)

### Community 5 - "frontend/package.json"
Cohesion: 0.13
Nodes (14): expo-document-picker@*, expo-image-picker@*, idb@^8.0.4, @notion-clone/shared@0.1.0, react-native-worklets@0.13.0, @notion-clone/shared, main, name (+6 more)

### Community 6 - "scripts"
Cohesion: 0.06
Nodes (41): devDependencies, concurrently@^8.2.2, eslint@^8.57.1, eslint-config-prettier@^9.1.0, prettier@^3.3.3, typescript@^5.6.3, @typescript-eslint/eslint-plugin@^7.18.0, @typescript-eslint/parser@^7.18.0 (+33 more)

### Community 7 - "app.ts"
Cohesion: 0.08
Nodes (47): zod@^3.23.8, createApp(), C, created(), errorResponse(), noContent(), ok(), optionalJson() (+39 more)

### Community 8 - "Plan: Sheets & Formulas"
Cohesion: 0.10
Nodes (36): Plan: Tables in the editor, Table Serializer (blockToNode / nodeToBlocks), Table / table_row Block Model, TipTap Table Extensions (@tiptap/extension-table + row/cell/header), Spec: Tables in the editor, Tasks: Tables in the editor, Plan: Databases, Database Prisma Model (+28 more)

### Community 9 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, hono@^4.13.19, markdown-it@^14.3.0, @neondatabase/serverless@0.10.4, @notion-clone/shared@0.1.0, @prisma/adapter-neon@5.22.0, @prisma/client@^5.22.0, unpdf@^1.8.0 (+7 more)

### Community 10 - "api-types.ts"
Cohesion: 0.06
Nodes (34): AdoptLocalDatabase, AdoptLocalRequest, AdoptLocalResponse, AdoptLocalValue, ApiSuccess, BreadcrumbsResponse, ComputedCellStatus, CreateBlockRequest (+26 more)

### Community 11 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @playwright/test@^1.48.2, @types/node@^22.9.0, @types/react@^19.0.0, typescript@^5.6.3, workbox-build@^7.4.1, @types/node, typescript (+3 more)

### Community 12 - "engine.ts"
Cohesion: 0.05
Nodes (57): AstNode, Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef (+49 more)

### Community 13 - "BlockDTO"
Cohesion: 0.18
Nodes (4): EditorProps, LocalSnapshot, BlockDTO, WorkspaceDTO

### Community 14 - "blocks.service.ts"
Cohesion: 0.15
Nodes (23): blocksRoutes, pageBlocksRoutes, CreateBlockInput, createBlockSchema, ReorderBlockInput, reorderBlockSchema, UpdateBlockInput, updateBlockSchema (+15 more)

### Community 15 - "getPrisma"
Cohesion: 0.06
Nodes (68): toDatabaseDTO(), toDatabaseViewDTO(), toPropertyDTO(), toPropertyValueDTO(), toRowDTO(), toTemplateDTO(), CreateDatabaseInput, createDatabaseSchema (+60 more)

### Community 16 - "Plan: 005 — Frontend app shell & sidebar"
Cohesion: 0.14
Nodes (21): Plan: 005 — Frontend app shell & sidebar, AppShell component, PageTree / PageTreeNode component, QuickSearch modal (Cmd/Ctrl+K), RequireAuth route guard, stores/session.ts (Zustand: user + auth actions), Sidebar component, stores/ui.ts (Zustand: sidebar + search modal state) (+13 more)

### Community 17 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, lib, module, moduleResolution, noEmitOnError, outDir, rootDir (+6 more)

### Community 18 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, baseUrl, moduleResolution, noEmit, paths, strict, types (+4 more)

### Community 19 - "Spec: 004 — Collaboration (permissions, sharing & comments)"
Cohesion: 0.14
Nodes (18): Plan: 004 — Collaboration (permissions, sharing & comments), Comment Prisma model, PagePermission Prisma model, Spec: 004 — Collaboration (permissions, sharing & comments), Public share route (GET /shared/:token), Tasks: 004 — Collaboration (permissions, sharing & comments), Spec: 005 — Frontend app shell & sidebar, Spec: 006 — Frontend block editor (TipTap) (+10 more)

### Community 20 - "registry/types.ts"
Cohesion: 0.08
Nodes (22): contentPlannerTemplate, crmTemplate, financeTrackerTemplate, habitTrackerTemplate, ALL_PAGE_TEMPLATES, knowledgeBaseTemplate, projectManagementTemplate, readingListTemplate (+14 more)

### Community 21 - "@tanstack/react-query"
Cohesion: 0.16
Nodes (22): DatabaseView(), VIEWS, TemplatesModal(), PageDatabases(), Loading(), useCreateDatabase(), usePageDatabases(), addProperty (+14 more)

### Community 22 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, container_name (+10 more)

### Community 23 - "shared/package.json"
Cohesion: 0.08
Nodes (27): import, types, import, types, devDependencies, tsx@^4.19.2, @types/node@^22.9.0, typescript@^5.6.3 (+19 more)

### Community 24 - "Plan 003 — Workspaces, Pages, Blocks, Search & Uploads"
Cohesion: 0.12
Nodes (16): AttachmentDTO, Block Endpoints, BlockDTO, Files/Attachments Endpoints, Page Endpoints, PageDTO, Search Endpoint, SearchResultDTO (+8 more)

### Community 25 - "request"
Cohesion: 0.10
Nodes (35): createBlock(), deleteBlock(), updateBlock(), request(), addProperty(), addRow(), createDatabase(), createTemplate() (+27 more)

### Community 26 - "getAccessiblePage"
Cohesion: 0.16
Nodes (18): ACCESS_RANK, collectAncestorIds(), getAccessiblePage(), resolveEffectiveAccess(), roleToAccess(), toCommentDTO(), CreateCommentInput, createCommentSchema (+10 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 28 - "markdown.ts"
Cohesion: 0.20
Nodes (14): storeUpload(), importFile(), parseByFormat(), SUPPORTED_EXTENSIONS, findInline(), inlineTokenToRichText(), md, parseMarkdown() (+6 more)

### Community 29 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit, outDir (+6 more)

### Community 30 - "docx.ts"
Cohesion: 0.18
Nodes (11): cheerio@^1.2.0, mammoth@^1.12.0, extFromMime(), extractInline(), htmlToBlocks(), runsFromElement(), parseDocx(), parseHtmlTable() (+3 more)

### Community 31 - "prisma/client.ts"
Cohesion: 0.15
Nodes (14): AppBindings, toAttachmentDTO(), ALLOWED, extOf(), FileBucket, isValidStorageKey(), mimeForKey(), UploadInput (+6 more)

### Community 32 - "Plan 000 — Architecture & Contracts"
Cohesion: 0.17
Nodes (12): Custom contentEditable (Rejected Alternative), Lexical (Not Considered, Deferred), Slate.js (Rejected Alternative), Data Model Summary (9 Tables), Architecture Overview Document, Editor Decision Cross-cutting Entry, API Contracts — Notion Clone (Single Source of Truth), Data Model (9 Prisma Tables) (+4 more)

### Community 34 - "lib/api/client.ts"
Cohesion: 0.16
Nodes (14): AuthResponse, getMe(), login(), logout(), register(), clearCredentials(), HOST, persistNativeTokens() (+6 more)

### Community 35 - "frontend/components/WorkspaceSwitcher.tsx"
Cohesion: 0.11
Nodes (22): WorkspaceIndex(), AppLayout(), AppShell(), plainSnippet(), QuickSearch(), close(), select(), workspaceIdFromPath() (+14 more)

### Community 36 - "Plan 002 — Authentication & Users"
Cohesion: 0.19
Nodes (11): argon2id Password Hashing (OWASP baseline), CSRF Guard (X-Requested-With + SameSite=Lax), Auth Module README, UserDTO Boundary Shape (never leaks password_hash), Auth Endpoints (register/login/logout/refresh/me), CommentDTO, Comments Endpoints, UserDTO (+3 more)

### Community 38 - "register"
Cohesion: 0.19
Nodes (20): NOW, loginAndCreatePage(), API, CSRF_HEADER, DEMO_EMAIL, DEMO_PASSWORD, HEADERS, JSON_HEADERS (+12 more)

### Community 39 - "react"
Cohesion: 0.22
Nodes (20): LoginScreen(), RegisterScreen(), FILTER_OPS, FilterSortBar(), filterValueText(), ReconnectScreen(), Button(), Chip() (+12 more)

### Community 40 - "Master Prompt: Notion Clone"
Cohesion: 0.32
Nodes (11): Master Prompt: Notion Clone, Spec-Driven Development Workflow Requirement, Task 0 — Architect, Task 1 — Monorepo and Environment Setup, Task 2 — Backend Authentication and Users, Task 3 — Workspaces, Pages and Blocks, Task 4 — Permissions and Collaboration, Task 5 — Frontend App Shell and Sidebar (+3 more)

### Community 41 - "frontend/features/editor/Editor.tsx"
Cohesion: 0.13
Nodes (24): BlockRow(), updateImage(), BlockRowProps, TEXT_STYLES, blockToText(), isRecord(), makeBlock(), richTextToPlainText() (+16 more)

### Community 42 - "App.tsx"
Cohesion: 0.21
Nodes (11): listWorkspaces(), App(), WorkspaceIndex(), RequireAuth(), WorkspaceSwitcher(), useChildPages(), useWorkspaces(), LoginPage() (+3 more)

### Community 43 - "Notion Clone Root README"
Cohesion: 0.12
Nodes (17): Postgres Docker Compose Service (Colima-compatible), 1. Authenticate, 2. Neon database, 3. Cloudflare Workers backend, 4. Cloudflare Pages frontend, 5. Wire them together, Deployment: Cloudflare + Neon, Live deployment (+9 more)

### Community 44 - "Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)"
Cohesion: 0.29
Nodes (8): Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX), DOCX Parser (mammoth + cheerio), POST /workspaces/:workspaceId/import Endpoint, Frontend Import UI (Sidebar/PageTree button + file picker), Markdown Parser (markdown-it), PDF Parser (unpdf), Spreadsheet Parser (xlsx/SheetJS), Text Parser (line-by-line)

### Community 45 - "export.service.ts"
Cohesion: 0.33
Nodes (8): pdf-lib@^1.17.1, blockPlainText(), blockToMarkdown(), richTextToMd(), sanitize(), toMarkdown(), toPdf(), pdf-lib

### Community 46 - "routes/workspaces.ts"
Cohesion: 0.30
Nodes (8): workspacesRoutes, getAccessibleWorkspace(), toWorkspaceDTO(), CreateWorkspaceInput, createWorkspaceSchema, createWorkspace(), getWorkspace(), listWorkspacesForUser()

### Community 47 - "PageHeader.tsx"
Cohesion: 0.17
Nodes (20): uploadImage(), listChildPages(), updatePage(), EmojiPicker(), EMOJIS, PageHeader(), applyToCaches(), handleCoverUpload() (+12 more)

### Community 48 - "lib/session.ts"
Cohesion: 0.18
Nodes (13): RootLayout(), isUnauthorized(), adoptLocal(), adoptLocalData(), queryClient, enterGuest(), finishSignIn(), SessionMode (+5 more)

### Community 49 - "frontend/components/db/CellEditor.tsx"
Cohesion: 0.22
Nodes (30): BoardView(), CellEditor(), CellEditorProps, GalleryView(), colorFor(), displayCellText(), formatComputed(), formatValue() (+22 more)

### Community 51 - "@tanstack/react-query"
Cohesion: 0.13
Nodes (27): PageScreen(), WorkspaceView(), TrashScreen(), PageAttachments(), PageTree(), PageTreeNode(), PageTreeProps, H2() (+19 more)

### Community 52 - "Spec: 016 — Database Templates"
Cohesion: 0.20
Nodes (9): 1. Summary, 2. Motivation / user stories, 3. Scope, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Dependencies, 7. Open questions, In scope, Out of scope (documented follow-ups) (+1 more)

### Community 53 - "local/databases.ts"
Cohesion: 0.06
Nodes (77): isAllowedOrigin(), updateLanguage(), ApiClientError, createBlock(), deleteBlock(), updateBlock(), addProperty(), addRow() (+69 more)

### Community 54 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android, build:web, dev, e2e:server:backend, e2e:server:frontend, ios, release:ios (+5 more)

### Community 55 - "Plan: 009 — Dark mode + full-height sidebar"
Cohesion: 0.47
Nodes (5): Plan: 009 — Dark mode + full-height sidebar, index.html inline anti-FOUC script, Editor CSS → CSS variables (--nc-* tokens), Full-height sidebar fix (h-full aside), stores/theme.ts (Zustand + persist, light|dark|system)

### Community 56 - "src/components/PageTree.tsx"
Cohesion: 0.14
Nodes (12): importFile(), deletePage(), movePage(), PageTree(), handleImport(), PageTreeNode(), handleDelete(), Toaster() (+4 more)

### Community 57 - "src/api/pages.ts"
Cohesion: 0.44
Nodes (6): getPage(), listTrashedPages(), permanentDeletePage(), restorePage(), PageViewStub(), TrashView()

### Community 58 - "src/api/databases.ts"
Cohesion: 0.25
Nodes (14): addProperty(), addRow(), createTemplate(), deleteProperty(), deleteRow(), deleteTemplate(), updateTemplate(), TemplatesModal() (+6 more)

### Community 59 - "prepare-pages.js"
Cohesion: 0.22
Nodes (6): diskBucket(), copies, dist, fs, path, scriptsDir

### Community 61 - "src/components/db/CellEditor.tsx"
Cohesion: 0.26
Nodes (19): getDatabase(), updateProperty(), CellEditor(), FormulaCell(), FormulaPopover(), MultiSelectEditor(), RelationEditor(), rowTitle() (+11 more)

### Community 62 - "expo"
Cohesion: 0.10
Nodes (19): edgeToEdge, package, typedRoutes, expo, android, experiments, ios, name (+11 more)

### Community 63 - "request"
Cohesion: 0.14
Nodes (20): getMe(), login(), logout(), refresh(), register(), createBlock(), deleteBlock(), updateBlock() (+12 more)

### Community 64 - "src/features/editor/Editor.tsx"
Cohesion: 0.06
Nodes (25): createDatabase(), lowlight, PMNode, Callout, @tiptap/core, Commands, PageRef, @tiptap/core (+17 more)

### Community 65 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, expo-constants@*, expo-file-system@*, expo-router@~58.0.31, expo-sqlite@~58.0.17, react@19.3.0, react-native@0.88.1, react-native-reanimated@* (+10 more)

### Community 66 - "release-ios.mjs"
Cohesion: 0.11
Nodes (17): app, appJson, appJsonPath, archive, auth, d, exportDir, exported (+9 more)

### Community 67 - "DatabaseDTO"
Cohesion: 0.17
Nodes (18): ViewProps, FilterSortBar(), Panel(), DatabaseDTO, DatabaseViewDTO, Filter, Sort, ViewConfig (+10 more)

### Community 68 - "TemplateCard.tsx"
Cohesion: 0.19
Nodes (13): instantiatePageTemplate(), listPageTemplates(), createPage(), NewPageModal(), TemplateCard, TemplateGalleryModal(), focusCard(), handleGridKeyDown() (+5 more)

### Community 69 - "PageView.tsx"
Cohesion: 0.23
Nodes (11): AttachmentInfo, listAttachments(), getPageBreadcrumbs(), Breadcrumbs(), fileIcon(), FileRow(), formatSize(), PageAttachments() (+3 more)

### Community 72 - "src/components/Sidebar.tsx"
Cohesion: 0.24
Nodes (10): AppShell(), QuickSearch(), Sidebar(), applyTheme(), systemPrefersDark(), ThemeMode, ThemeState, useTheme (+2 more)

### Community 73 - "frontend/stores/theme.ts"
Cohesion: 0.17
Nodes (11): TemplatePrefsState, useTemplatePrefs, secureStore, sessionFlag, StoredTokens, tokenStorage, appStorage, ThemeMode (+3 more)

### Community 74 - "ErrorBoundary"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, queryClient

### Community 75 - "adopt.service.ts"
Cohesion: 0.28
Nodes (8): AdoptLocalInput, adoptLocalData(), AdoptResult, BLOCK_TYPES, date(), json(), PROPERTY_TYPES, VIEW_TYPES

### Community 82 - "Spec: 014 — Databases v2 (Notion-style)"
Cohesion: 0.22
Nodes (8): 1. Summary, 2. Motivation / user stories, 3. Scope, 4. Developer-facing behavior, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Slices (implementation order), Out of scope (documented follow-ups), Spec: 014 — Databases v2 (Notion-style)

### Community 84 - "Databases — full Notion-style build-out"
Cohesion: 0.09
Nodes (22): Backend, Backend, Cross-cutting, Databases — full Notion-style build-out, Docs, Frontend, Frontend, Frontend (+14 more)

### Community 85 - "misc.ts"
Cohesion: 0.14
Nodes (9): AttachmentInfo, listAttachments(), instantiatePageTemplate(), listPageTemplates(), instantiatePageTemplate(), PAGE_TEMPLATES, instantiatePageTemplate, listPageTemplates (+1 more)

### Community 86 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:worker, dev, postinstall, prisma:deploy, prisma:generate, prisma:migrate (+5 more)

### Community 87 - "auth.service.ts"
Cohesion: 0.05
Nodes (62): jose@^6.2.17, main(), extractText(), main(), refreshContentText(), env, Env, envSchema (+54 more)

### Community 89 - "@playwright/test"
Cohesion: 0.11
Nodes (5): __dirname, AUTH_FILE, __dirname, ROOT, @playwright/test

### Community 90 - "TemplateDTO"
Cohesion: 0.20
Nodes (10): LocalDatabaseDef, TemplateDTO, Orden de ejecución, Plan: Templates para Databases (Notion-style), Slice 1 — Modelo de datos + migración, Slice 2 — Contratos compartidos (`shared/`), Slice 4 — Backend: rutas, controladores, schemas, Slice 5 — Exclusión de la Page oculta (3 puntos) (+2 more)

### Community 92 - "KV"
Cohesion: 0.19
Nodes (6): openIdbKV(), getLocalKV(), getLocalKV(), getLocalKV(), KV, openSqliteKV()

### Community 93 - "uploads.ts"
Cohesion: 0.60
Nodes (4): appendAsset(), importFile(), PickedAsset, uploadImage()

### Community 94 - "Implementation steps"
Cohesion: 0.15
Nodes (12): 1. Foundations, 2. Session & routing (remove the login wall), 3. Repository layer + UI wiring, 4. Merge-on-login ("adopt local data"), 5. PWA / offline shell (web), 6. Tests & docs, Architecture, Context (+4 more)

### Community 96 - "metro.config.js"
Cohesion: 0.25
Nodes (7): config, { getDefaultConfig }, { withNativeWind }, expo@~58.0.25, nativewind@^4.2.7, expo, nativewind

### Community 97 - "generate-icons.mjs"
Cohesion: 0.24
Nodes (9): BG, chunk(), crc32(), CRC_TABLE, __dirname, draw(), encodePng(), FG (+1 more)

### Community 98 - "Spec: Local guest mode (optional login, offline-capable)"
Cohesion: 0.18
Nodes (10): 1. Summary, 2. Motivation / user stories, 3. Scope, 4. User-facing behavior, 5. Dependencies, 6. Acceptance criteria (must be testable 1:1 by e2e tests), 7. Open questions, In scope (+2 more)

### Community 103 - "server.ts"
Cohesion: 0.13
Nodes (14): dotenv@^16.4.7, @hono/node-server@^2.1.9, pino@^9.5.0, LogFn, logger, LoggerLike, disconnectPrisma(), app (+6 more)

### Community 106 - "Tasks: Local guest mode (optional login, offline-capable)"
Cohesion: 0.29
Nodes (6): Docs, Implementation, Notes / deviations found during implementation, Tasks: Local guest mode (optional login, offline-capable), Tests, Verification gate

### Community 107 - "Tasks: 016 — Database Templates"
Cohesion: 0.50
Nodes (3): Notes, Tasks: 016 — Database Templates, Tests

## Ambiguous Edges - Review These
- `Toast store + Toaster component` → `Spec: 004 — Collaboration (permissions, sharing & comments)`  [AMBIGUOUS]
  specs/008-qa/plan.md · relation: references

## Knowledge Gaps
- **47 isolated node(s):** `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json`, `stores/session.ts (Zustand: user + auth actions)`, `stores/ui.ts (Zustand: sidebar + search modal state)` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `@playwright/test` to `HEADERS`, `templates.spec.ts`, `register`, `frontend/package.json`, `app.spec.ts`, `devDependencies`, `sheets.spec.ts`, `databases.spec.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14366998577524892 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `src/components/DatabaseView.tsx`, `frontend/package.json`, `@tanstack/react-query`, `frontend/components/WorkspaceSwitcher.tsx`, `frontend/features/editor/Editor.tsx`, `App.tsx`, `PageHeader.tsx`, `lib/session.ts`, `frontend/components/db/CellEditor.tsx`, `@tanstack/react-query`, `src/components/PageTree.tsx`, `src/api/databases.ts`, `src/components/db/CellEditor.tsx`, `request`, `src/features/editor/Editor.tsx`, `dependencies`, `DatabaseDTO`, `TemplateCard.tsx`, `PageView.tsx`, `src/components/Sidebar.tsx`, `ErrorBoundary`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `features/formulas/parser.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09797979797979799 - nodes in this community are weakly interconnected._
- **Why does `LocalStore` connect `LocalStore` to `Tasks: Local guest mode (optional login, offline-capable)`, `BlockDTO`, `local/databases.ts`, `KV`, `Implementation steps`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Toast store + Toaster component` and `Spec: 004 — Collaboration (permissions, sharing & comments)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._