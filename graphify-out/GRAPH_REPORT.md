# Graph Report - notion-clone  (2026-11-17)

## Corpus Check
- 372 files · ~137,817 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .sqlite 7, .sqlite-shm 7, .sqlite-wal 7)

## Summary
- 2010 nodes · 5377 edges · 104 communities (81 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 188 edges (avg confidence: 0.88)
- Token cost: 0 input · 297,143 output

## Graph Freshness
- Built from commit: `e617e10e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.service.ts
- src/api/databases.ts
- features/formulas/parser.ts
- backend/package.json
- auth.service.ts
- frontend/package.json
- scripts
- workers/app.ts
- Plan: Sheets & Formulas
- dependencies
- api-types.ts
- devDependencies
- engine.ts
- src/app.ts
- blocks.service.ts
- databases.controller.ts
- Plan: 005 — Frontend app shell & sidebar
- compilerOptions
- compilerOptions
- Spec: 004 — Collaboration (permissions, sharing & comments)
- registry/index.ts
- ui.tsx
- postgres
- shared/package.json
- Plan 003 — Workspaces, Pages, Blocks, Search & Uploads
- request
- comments.controller.ts
- compilerOptions
- markdown.ts
- compilerOptions
- docx.ts
- page-templates.service.ts
- Plan 000 — Architecture & Contracts
- e2e/helpers.ts
- [wsId]/index.tsx
- react-native
- Plan 002 — Authentication & Users
- templates.spec.ts
- register
- prisma/client.ts
- Master Prompt: Notion Clone
- frontend/features/editor/Editor.tsx
- App.tsx
- Notion Clone Root README
- Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)
- export.ts
- @tanstack/react-query
- PageHeader.tsx
- auth/permissions.service.ts
- frontend/components/db/CellEditor.tsx
- getPrisma
- applyViewConfig.ts
- Spec: 016 — Database Templates
- databases.dto.ts
- scripts
- Plan: 009 — Dark mode + full-height sidebar
- src/components/PageTree.tsx
- Spec: 014 — Databases v2 (Notion-style)
- auth.controller.ts
- workers/index.ts
- sheets.spec.ts
- Slice 6 — New property types: multi_select, status, system types (backend + frontend)
- expo
- request
- src/features/editor/Editor.tsx
- dependencies
- src/components/PageAttachments.tsx
- comments.schema.ts
- TemplateCard.tsx
- src/api/pages.ts
- PermissionDTO
- src/stores/theme.ts
- frontend/stores/theme.ts
- ErrorBoundary
- @playwright/test
- Real-time Socket.io Events
- Tasks: 005 — Frontend app shell & sidebar
- Tasks: 006 — Frontend block editor (TipTap)
- Tasks: 007 — Page view header, cover & icon
- Tasks: 008 — QA pass
- Tasks: 009 — Dark mode + full-height sidebar
- Spec: 014 — Databases v2 (Notion-style)
- serializers.ts
- Databases — full Notion-style build-out
- export.ts
- scripts
- password.ts
- AGENTS.md
- @playwright/test
- Tasks: 016 — Database Templates
- page-templates.schema.ts
- workspaces.schema.ts
- expo-constants@*
- databases.spec.ts
- metro.config.js
- jwt.ts
- tailwindcss

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 105 edges
2. `getAccessiblePage()` - 59 edges
3. `request()` - 51 edges
4. `request()` - 49 edges
5. `@tanstack/react-query` - 46 edges
6. `ok()` - 45 edges
7. `react` - 44 edges
8. `notFound()` - 41 edges
9. `badRequest()` - 40 edges
10. `express` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Implementation` --references--> `CreateRowRequest`  [INFERRED]
  specs/016-database-templates/tasks.md → shared/api-types.ts
- `Implementation` --references--> `CreateTemplateRequest`  [INFERRED]
  specs/016-database-templates/tasks.md → shared/api-types.ts
- `Implementation` --references--> `UpdateTemplateRequest`  [INFERRED]
  specs/016-database-templates/tasks.md → shared/api-types.ts
- `Backend` --references--> `getPageWithBlocks()`  [INFERRED]
  .zcode/plans/plan-sess_02cc782c-10a7-49bb-ab48-7a4401f856a1.md → backend/src/modules/pages/pages.service.ts
- `Backend` --references--> `moveView()`  [INFERRED]
  .zcode/plans/plan-sess_02cc782c-10a7-49bb-ab48-7a4401f856a1.md → backend/src/modules/databases/databases.service.ts

## Import Cycles
- 2-file cycle: `backend/src/modules/formulas/engine.ts -> backend/src/modules/formulas/evaluator.ts -> backend/src/modules/formulas/engine.ts`
- 2-file cycle: `backend/src/modules/formulas/evaluator.ts -> backend/src/modules/formulas/functions.ts -> backend/src/modules/formulas/evaluator.ts`
- 3-file cycle: `backend/src/modules/formulas/engine.ts -> backend/src/modules/formulas/evaluator.ts -> backend/src/modules/formulas/functions.ts -> backend/src/modules/formulas/engine.ts`

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

## Communities (104 total, 23 thin omitted)

### Community 0 - "pages.service.ts"
Cohesion: 0.11
Nodes (38): assertWorkspaceMember(), createPageHandler(), deletePageHandler(), duplicatePageHandler(), getAncestorsHandler(), getPageHandler(), listPagesHandler(), listTrashHandler() (+30 more)

### Community 1 - "src/api/databases.ts"
Cohesion: 0.09
Nodes (54): addProperty(), addRow(), createTemplate(), createView(), deleteDatabase(), deleteProperty(), deleteRow(), deleteTemplate() (+46 more)

### Community 2 - "features/formulas/parser.ts"
Cohesion: 0.10
Nodes (29): AGGREGATION_FUNCTIONS, AstNode, cmp(), ComputedCell, ComputedCellStatus, evalArg(), evalBinary(), EvalContext (+21 more)

### Community 3 - "backend/package.json"
Cohesion: 0.08
Nodes (36): devDependencies, @cloudflare/workers-types@^5.20261116.1, pino-pretty@^11.3.0, prisma@^5.22.0, tsx@^4.19.2, @types/cheerio@^1.0.0, @types/cookie-parser@^1.4.7, @types/cors@^2.8.17 (+28 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.11
Nodes (30): getCurrentUser(), IssuedSession, issueSession(), login(), refresh(), RefreshResult, register(), CommentWithUser (+22 more)

### Community 5 - "frontend/package.json"
Cohesion: 0.11
Nodes (18): expo-file-system@*, expo-image-picker@*, expo-sharing@*, expo-status-bar@*, react-native-gesture-handler@~3.3.0, react-native-screens@*, react-native-web@0.21.4, main (+10 more)

### Community 6 - "scripts"
Cohesion: 0.06
Nodes (41): devDependencies, concurrently@^8.2.2, eslint@^8.57.1, eslint-config-prettier@^9.1.0, prettier@^3.3.3, typescript@^5.6.3, @typescript-eslint/eslint-plugin@^7.18.0, @typescript-eslint/parser@^7.18.0 (+33 more)

### Community 7 - "workers/app.ts"
Cohesion: 0.14
Nodes (31): CreatePermissionInput, createPermissionSchema, createWorkerApp(), C, created(), errorResponse(), noContent(), ok() (+23 more)

### Community 8 - "Plan: Sheets & Formulas"
Cohesion: 0.10
Nodes (36): Plan: Tables in the editor, Table Serializer (blockToNode / nodeToBlocks), Table / table_row Block Model, TipTap Table Extensions (@tiptap/extension-table + row/cell/header), Spec: Tables in the editor, Tasks: Tables in the editor, Plan: Databases, Database Prisma Model (+28 more)

### Community 9 - "dependencies"
Cohesion: 0.05
Nodes (37): dependencies, argon2@^0.41.1, cookie-parser@^1.4.7, cors@^2.8.5, dotenv@^16.4.7, express@^4.21.2, hash-wasm@^4.13.0, hono@^4.13.19 (+29 more)

### Community 10 - "api-types.ts"
Cohesion: 0.07
Nodes (42): ApiSuccess, BreadcrumbsResponse, ComputedCellStatus, CreateBlockRequest, CreateCommentRequest, CreatePermissionRequest, CreateRowRequest, CreateTemplateRequest (+34 more)

### Community 11 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @playwright/test@^1.48.2, @types/node@^22.9.0, @types/react@^19.0.0, typescript@^5.6.3, @types/node, typescript, @types/react

### Community 12 - "engine.ts"
Cohesion: 0.05
Nodes (54): AstNode, Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef (+46 more)

### Community 13 - "src/app.ts"
Cohesion: 0.06
Nodes (60): createApp(), pinoHttp, PinoHttpFn, env, Env, envSchema, parsed, LogFn (+52 more)

### Community 14 - "blocks.service.ts"
Cohesion: 0.14
Nodes (26): deleteBlockHandler(), listBlocksHandler(), reorderBlockHandler(), updateBlockHandler(), CreateBlockInput, createBlockSchema, ReorderBlockInput, reorderBlockSchema (+18 more)

### Community 15 - "databases.controller.ts"
Cohesion: 0.08
Nodes (55): addPropertyHandler(), addRowHandler(), createDatabaseHandler(), createTemplateHandler(), createViewHandler(), deleteDatabaseHandler(), deletePropertyHandler(), deleteRowHandler() (+47 more)

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

### Community 20 - "registry/index.ts"
Cohesion: 0.10
Nodes (15): contentPlannerTemplate, crmTemplate, financeTrackerTemplate, habitTrackerTemplate, knowledgeBaseTemplate, projectManagementTemplate, readingListTemplate, secondBrainTemplate (+7 more)

### Community 21 - "ui.tsx"
Cohesion: 0.18
Nodes (26): LoginScreen(), RegisterScreen(), DatabaseView(), VIEW_TYPES, FILTER_OPS, FilterSortBar(), filterValueText(), isGroupable() (+18 more)

### Community 22 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, container_name (+10 more)

### Community 23 - "shared/package.json"
Cohesion: 0.11
Nodes (19): import, types, import, types, devDependencies, typescript@^5.6.3, exports, ./api-types (+11 more)

### Community 24 - "Plan 003 — Workspaces, Pages, Blocks, Search & Uploads"
Cohesion: 0.12
Nodes (16): AttachmentDTO, Block Endpoints, BlockDTO, Files/Attachments Endpoints, Page Endpoints, PageDTO, Search Endpoint, SearchResultDTO (+8 more)

### Community 25 - "request"
Cohesion: 0.16
Nodes (19): useCreateDatabase(), usePageDatabases(), usePageTemplates(), request(), addProperty(), createDatabase(), createTemplate(), deleteDatabase() (+11 more)

### Community 26 - "comments.controller.ts"
Cohesion: 0.36
Nodes (10): createCommentHandler(), deleteCommentHandler(), listCommentsHandler(), updateCommentHandler(), toCommentDTO(), createComment(), deleteComment(), listComments() (+2 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 28 - "markdown.ts"
Cohesion: 0.19
Nodes (15): xlsx@^0.18.5, importFile(), parseByFormat(), SUPPORTED_EXTENSIONS, findInline(), inlineTokenToRichText(), md, parseMarkdown() (+7 more)

### Community 29 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit, outDir (+6 more)

### Community 30 - "docx.ts"
Cohesion: 0.18
Nodes (11): cheerio@^1.2.0, mammoth@^1.12.0, extFromMime(), extractInline(), htmlToBlocks(), runsFromElement(), parseDocx(), parseHtmlTable() (+3 more)

### Community 31 - "page-templates.service.ts"
Cohesion: 0.24
Nodes (12): createBlockHandler(), instantiatePageTemplateHandler(), listPageTemplatesHandler(), createBlockTree(), instantiatePageTemplate(), isRelationValue(), listPageTemplates(), resolveBlockContent() (+4 more)

### Community 32 - "Plan 000 — Architecture & Contracts"
Cohesion: 0.17
Nodes (12): Custom contentEditable (Rejected Alternative), Lexical (Not Considered, Deferred), Slate.js (Rejected Alternative), Data Model Summary (9 Tables), Architecture Overview Document, Editor Decision Cross-cutting Entry, API Contracts — Notion Clone (Single Source of Truth), Data Model (9 Prisma Tables) (+4 more)

### Community 33 - "e2e/helpers.ts"
Cohesion: 0.20
Nodes (8): createFreshPageInFirstWorkspace(), DEMO_EMAIL, DEMO_PASSWORD, HEADERS, JSON_HEADERS, login(), parseBody(), postJson()

### Community 34 - "[wsId]/index.tsx"
Cohesion: 0.09
Nodes (23): AuthResponse, getMe(), login(), logout(), register(), ApiClientError, clearCredentials(), HOST (+15 more)

### Community 35 - "react-native"
Cohesion: 0.11
Nodes (26): WorkspaceIndex(), AppLayout(), Index(), RootLayout(), AppShell(), PageTree(), plainSnippet(), QuickSearch() (+18 more)

### Community 36 - "Plan 002 — Authentication & Users"
Cohesion: 0.19
Nodes (11): argon2id Password Hashing (OWASP baseline), CSRF Guard (X-Requested-With + SameSite=Lax), Auth Module README, UserDTO Boundary Shape (never leaks password_hash), Auth Endpoints (register/login/logout/refresh/me), CommentDTO, Comments Endpoints, UserDTO (+3 more)

### Community 38 - "register"
Cohesion: 0.27
Nodes (12): loginAndCreatePage(), API, CSRF_HEADER, makeBlock(), makePage(), makeWorkspace(), register(), uniqueEmail() (+4 more)

### Community 39 - "prisma/client.ts"
Cohesion: 0.12
Nodes (18): ACCESS_RANK, collectAncestorIds(), resolveEffectiveAccess(), roleToAccess(), createPermissionHandler(), deletePermissionHandler(), getSharedPageHandler(), listPermissionsHandler() (+10 more)

### Community 40 - "Master Prompt: Notion Clone"
Cohesion: 0.32
Nodes (11): Master Prompt: Notion Clone, Spec-Driven Development Workflow Requirement, Task 0 — Architect, Task 1 — Monorepo and Environment Setup, Task 2 — Backend Authentication and Users, Task 3 — Workspaces, Pages and Blocks, Task 4 — Permissions and Collaboration, Task 5 — Frontend App Shell and Sidebar (+3 more)

### Community 41 - "frontend/features/editor/Editor.tsx"
Cohesion: 0.12
Nodes (25): BlockRow(), updateImage(), BlockRowProps, TEXT_STYLES, TEXT_TYPES, blockToText(), isRecord(), makeBlock() (+17 more)

### Community 42 - "App.tsx"
Cohesion: 0.17
Nodes (15): App(), WorkspaceIndex(), AppShell(), QuickSearch(), RequireAuth(), Sidebar(), WorkspaceSwitcher(), useChildPages() (+7 more)

### Community 43 - "Notion Clone Root README"
Cohesion: 0.12
Nodes (17): Postgres Docker Compose Service (Colima-compatible), 1. Authenticate, 2. Neon database, 3. Cloudflare Workers backend, 4. Cloudflare Pages frontend, 5. Wire them together, Deployment: Cloudflare + Neon, Live deployment (+9 more)

### Community 44 - "Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)"
Cohesion: 0.29
Nodes (8): Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX), DOCX Parser (mammoth + cheerio), POST /workspaces/:workspaceId/import Endpoint, Frontend Import UI (Sidebar/PageTree button + file picker), Markdown Parser (markdown-it), PDF Parser (unpdf), Spreadsheet Parser (xlsx/SheetJS), Text Parser (line-by-line)

### Community 45 - "export.ts"
Cohesion: 0.35
Nodes (9): exportPageHandler(), blockToHtml(), blockToMarkdown(), escapeHtml(), richTextToHtml(), richTextToMd(), toHtml(), toMarkdown() (+1 more)

### Community 46 - "@tanstack/react-query"
Cohesion: 0.12
Nodes (31): PageScreen(), WorkspaceView(), TrashScreen(), PageAttachments(), PageTreeNode(), PageTreeProps, Loading(), Muted() (+23 more)

### Community 47 - "PageHeader.tsx"
Cohesion: 0.28
Nodes (13): updatePage(), EmojiPicker(), EMOJIS, PageHeader(), applyToCaches(), handleCoverUpload(), invalidatePageLists(), saveCover() (+5 more)

### Community 48 - "auth/permissions.service.ts"
Cohesion: 0.38
Nodes (8): getAccessibleWorkspace(), createWorkspaceHandler(), getWorkspaceHandler(), listWorkspacesHandler(), toWorkspaceDTO(), createWorkspace(), getWorkspace(), listWorkspacesForUser()

### Community 49 - "frontend/components/db/CellEditor.tsx"
Cohesion: 0.24
Nodes (28): BoardView(), isGroupable(), CellEditor(), CellEditorProps, GalleryView(), colorFor(), displayCellText(), formatComputed() (+20 more)

### Community 50 - "getPrisma"
Cohesion: 0.16
Nodes (43): getAccessiblePage(), toTemplateDTO(), addProperty(), addRow(), aggregate(), deleteDatabase(), deleteProperty(), deleteRow() (+35 more)

### Community 51 - "applyViewConfig.ts"
Cohesion: 0.18
Nodes (11): applyViewConfig(), asScalar(), compareOrd(), matches(), sortRows(), props, ViewRow, ALL_PAGE_TEMPLATES (+3 more)

### Community 52 - "Spec: 016 — Database Templates"
Cohesion: 0.20
Nodes (9): 1. Summary, 2. Motivation / user stories, 3. Scope, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Dependencies, 7. Open questions, In scope, Out of scope (documented follow-ups) (+1 more)

### Community 53 - "databases.dto.ts"
Cohesion: 0.19
Nodes (14): toDatabaseDTO(), toPropertyDTO(), toPropertyValueDTO(), toRowDTO(), PropertyValueDTO, TemplateDTO, Notas / no-roturas, Orden de ejecución (+6 more)

### Community 54 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android, build:web, dev, e2e:server:backend, e2e:server:frontend, ios, start (+4 more)

### Community 55 - "Plan: 009 — Dark mode + full-height sidebar"
Cohesion: 0.47
Nodes (5): Plan: 009 — Dark mode + full-height sidebar, index.html inline anti-FOUC script, Editor CSS → CSS variables (--nc-* tokens), Full-height sidebar fix (h-full aside), stores/theme.ts (Zustand + persist, light|dark|system)

### Community 56 - "src/components/PageTree.tsx"
Cohesion: 0.15
Nodes (11): importFile(), deletePage(), movePage(), PageTree(), handleImport(), PageTreeNode(), handleDelete(), useMovePage() (+3 more)

### Community 57 - "Spec: 014 — Databases v2 (Notion-style)"
Cohesion: 0.29
Nodes (6): 1. Summary, 2. Motivation / user stories, 4. Developer-facing behavior, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Slices (implementation order), Spec: 014 — Databases v2 (Notion-style)

### Community 58 - "auth.controller.ts"
Cohesion: 0.22
Nodes (13): isNative(), loginHandler(), logoutHandler(), meHandler(), presentedRefreshToken(), refreshHandler(), registerHandler(), sessionBody() (+5 more)

### Community 59 - "workers/index.ts"
Cohesion: 0.60
Nodes (4): runWithPrisma(), Env, initWorkerEnv(), fetch()

### Community 61 - "Slice 6 — New property types: multi_select, status, system types (backend + frontend)"
Cohesion: 0.33
Nodes (6): Backend, Frontend, multi_select, Slice 6 — New property types: multi_select, status, system types (backend + frontend), status, System types (`created_time`, `created_by`, `last_edited_time`, `last_edited_by`)

### Community 62 - "expo"
Cohesion: 0.10
Nodes (19): edgeToEdge, package, typedRoutes, expo, android, experiments, ios, name (+11 more)

### Community 63 - "request"
Cohesion: 0.16
Nodes (15): getMe(), login(), logout(), refresh(), register(), ApiClientError, request(), deleteView() (+7 more)

### Community 64 - "src/features/editor/Editor.tsx"
Cohesion: 0.06
Nodes (22): createDatabase(), uploadImage(), listChildPages(), Editor(), handleImageUpload(), handlePageRef(), lowlight, PMNode (+14 more)

### Community 65 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, expo-document-picker@*, expo-linking@*, @expo/metro-runtime@*, expo-router@~58.0.31, @notion-clone/shared@0.1.0, react@19.3.0, react-dom@19.3.0 (+14 more)

### Community 66 - "src/components/PageAttachments.tsx"
Cohesion: 0.46
Nodes (6): AttachmentInfo, listAttachments(), fileIcon(), FileRow(), formatSize(), PageAttachments()

### Community 67 - "comments.schema.ts"
Cohesion: 0.40
Nodes (4): CreateCommentInput, createCommentSchema, UpdateCommentInput, updateCommentSchema

### Community 68 - "TemplateCard.tsx"
Cohesion: 0.18
Nodes (14): instantiatePageTemplate(), listPageTemplates(), createPage(), NewPageModal(), TemplateCard, TemplateGalleryModal(), focusCard(), handleGridKeyDown() (+6 more)

### Community 69 - "src/api/pages.ts"
Cohesion: 0.22
Nodes (12): getPage(), getPageBreadcrumbs(), listTrashedPages(), permanentDeletePage(), restorePage(), Breadcrumbs(), useDocumentTitle(), usePageBreadcrumbs() (+4 more)

### Community 72 - "src/stores/theme.ts"
Cohesion: 0.47
Nodes (5): applyTheme(), systemPrefersDark(), ThemeMode, ThemeState, useTheme

### Community 73 - "frontend/stores/theme.ts"
Cohesion: 0.18
Nodes (12): TemplatePrefsState, useTemplatePrefs, appStorage, storage, expo-secure-store@*, ThemeMode, ThemeState, useIsDark() (+4 more)

### Community 74 - "ErrorBoundary"
Cohesion: 0.19
Nodes (5): ErrorBoundary, Props, State, Toaster(), queryClient

### Community 82 - "Spec: 014 — Databases v2 (Notion-style)"
Cohesion: 0.22
Nodes (10): TplPropertyDefinition, TplViewDefinition, PropertyType, ViewType, 3. Scope, In scope (delivered in 7 slices), Out of scope (documented follow-ups), `backend/prisma/schema.prisma` (+2 more)

### Community 83 - "serializers.ts"
Cohesion: 0.19
Nodes (17): createBlock(), deleteBlock(), updateBlock(), EditorProps, blocksToDoc(), blockToNode(), docToBlocks(), emptyParagraph() (+9 more)

### Community 84 - "Databases — full Notion-style build-out"
Cohesion: 0.11
Nodes (18): Backend, Backend, Cross-cutting, Databases — full Notion-style build-out, Docs, Frontend, Frontend, Frontend (+10 more)

### Community 85 - "export.ts"
Cohesion: 0.60
Nodes (4): blockPlainText(), buildPdf(), exportRoutes, sanitize()

### Community 86 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:worker, dev, postinstall, prisma:deploy, prisma:generate, prisma:migrate (+5 more)

### Community 87 - "password.ts"
Cohesion: 0.18
Nodes (18): main(), extractText(), main(), refreshContentText(), disconnectPrisma(), constantTimeEqual(), fromBase64Url(), toBase64Url() (+10 more)

### Community 89 - "@playwright/test"
Cohesion: 0.10
Nodes (9): __dirname, AUTH_FILE, __dirname, copies, dist, fs, path, scriptsDir (+1 more)

### Community 90 - "Tasks: 016 — Database Templates"
Cohesion: 0.50
Nodes (3): Notes, Tasks: 016 — Database Templates, Tests

### Community 96 - "metro.config.js"
Cohesion: 0.25
Nodes (7): config, { getDefaultConfig }, { withNativeWind }, expo@~58.0.25, nativewind@^4.2.7, expo, nativewind

### Community 103 - "jwt.ts"
Cohesion: 0.60
Nodes (4): AccessTokenPayload, secretKey(), signAccessToken(), verifyAccessToken()

## Ambiguous Edges - Review These
- `Toast store + Toaster component` → `Spec: 004 — Collaboration (permissions, sharing & comments)`  [AMBIGUOUS]
  specs/008-qa/plan.md · relation: references

## Knowledge Gaps
- **47 isolated node(s):** `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json`, `stores/session.ts (Zustand: user + auth actions)`, `stores/ui.ts (Zustand: sidebar + search modal state)` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 557 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `@playwright/test` to `e2e/helpers.ts`, `templates.spec.ts`, `register`, `frontend/package.json`, `devDependencies`, `@playwright/test`, `sheets.spec.ts`, `databases.spec.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11295681063122924 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.tsx` to `src/features/editor/Editor.tsx`, `src/api/databases.ts`, `dependencies`, `react-native`, `TemplateCard.tsx`, `src/api/pages.ts`, `frontend/package.json`, `frontend/features/editor/Editor.tsx`, `App.tsx`, `ErrorBoundary`, `@tanstack/react-query`, `PageHeader.tsx`, `frontend/components/db/CellEditor.tsx`, `serializers.ts`, `src/components/PageTree.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `src/api/databases.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08911325724319578 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `prisma/client.ts` to `pages.service.ts`, `backend/package.json`, `auth.service.ts`, `workers/app.ts`, `dependencies`, `export.ts`, `blocks.service.ts`, `src/app.ts`, `auth/permissions.service.ts`, `getPrisma`, `databases.dto.ts`, `export.ts`, `comments.controller.ts`, `workers/index.ts`, `markdown.ts`, `page-templates.service.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Toast store + Toaster component` and `Spec: 004 — Collaboration (permissions, sharing & comments)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._