# Graph Report - notion-clone  (2026-08-02)

## Corpus Check
- 260 files · ~103,441 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1456 nodes · 2980 edges · 101 communities (73 shown, 28 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c83b927b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.controller.ts
- Sidebar.tsx
- features/formulas/parser.ts
- devDependencies
- auth.service.ts
- dependencies
- scripts
- Parser
- Plan: Sheets & Formulas
- dependencies
- api-types.ts
- devDependencies
- evaluator.ts
- app.ts
- blocks.service.ts
- databases.controller.ts
- Plan: 005 — Frontend app shell & sidebar
- compilerOptions
- compilerOptions
- Spec: 004 — Collaboration (permissions, sharing & comments)
- comments.controller.ts
- Editor.tsx
- graphify.js
- shared/package.json
- Plan 003 — Workspaces, Pages, Blocks, Search & Uploads
- databases.ts
- errors.ts
- compilerOptions
- import.service.ts
- compilerOptions
- block-schema.ts
- workspaces.controller.ts
- Plan 000 — Architecture & Contracts
- databases.service.ts
- PageTree.tsx
- engine.ts
- Plan 002 — Authentication & Users
- server.ts
- e2e/helpers.ts
- getPrisma
- Master Prompt: Notion Clone
- serializers.ts
- ErrorBoundary
- Plan 001 — Monorepo & Environment Setup
- Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)
- export.controller.ts
- auth.controller.ts
- Parser
- App.tsx
- pages.ts
- PageAttachments.tsx
- applyViewConfig.ts
- Spec: 016 — Database Templates
- Plan: Templates para Databases (Notion-style)
- scripts
- Plan: 009 — Dark mode + full-height sidebar
- global-setup.ts
- toDatabaseDTO
- frontend/package.json
- Tasks: 016 — Database Templates
- BlockContent
- express.d.ts
- search.controller.ts
- @tanstack/react-query
- ui.spec.ts
- Frontend HTML Entry Point
- playwright.config.ts
- PermissionDTO
- Real-time Socket.io Events
- Tasks: 005 — Frontend app shell & sidebar
- Tasks: 006 — Frontend block editor (TipTap)
- Tasks: 007 — Page view header, cover & icon
- Tasks: 008 — QA pass
- Tasks: 009 — Dark mode + full-height sidebar
- Spec: 014 — Databases v2 (Notion-style)
- ast.ts
- Databases — full Notion-style build-out
- @tiptap/extension-code-block-lowlight
- @tiptap/extension-image
- seed.ts
- AGENTS.md
- request
- @tiptap/extension-table
- @tiptap/extension-table-cell
- SlashMenu.tsx
- @tiptap/extension-task-item
- PageDTO
- @tiptap/extension-underline
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit
- zustand

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 101 edges
2. `getAccessiblePage()` - 54 edges
3. `request()` - 47 edges
4. `ok()` - 43 edges
5. `notFound()` - 36 edges
6. `badRequest()` - 32 edges
7. `created()` - 24 edges
8. `noContent()` - 19 edges
9. `requireAuth()` - 17 edges
10. `Parser` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Spec 003 — Workspaces, Pages, Blocks, Search & Uploads` --references--> `Task 3 — Workspaces, Pages and Blocks`  [INFERRED]
  specs/003-workspaces-pages-blocks/spec.md → notion-clone-subagent-prompt.md
- `asyncHandler Wrapper Pattern (Express 4 async crash fix)` --references--> `Auth Module README`  [INFERRED]
  specs/002-auth/tasks.md → backend/src/modules/auth/README.md
- `Spec 001 — Monorepo & Environment Setup` --references--> `Task 1 — Monorepo and Environment Setup`  [INFERRED]
  specs/001-setup/spec.md → notion-clone-subagent-prompt.md
- `Spec 002 — Authentication & Users` --references--> `Task 2 — Backend Authentication and Users`  [INFERRED]
  specs/002-auth/spec.md → notion-clone-subagent-prompt.md
- `Batch Block Creation via Single Transaction` --shares_data_with--> `Block Endpoints`  [INFERRED]
  .zcode/plans/plan-sess_1c094a45-e7e2-44f5-ba52-cab53e8c7f63.md → shared/contracts.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Master Prompt Sequential Task Dependency Chain (Task 0 → Task 8)** — notion_clone_subagent_prompt_task0_architect, notion_clone_subagent_prompt_task1_setup, notion_clone_subagent_prompt_task2_auth, notion_clone_subagent_prompt_task3_data_layer, notion_clone_subagent_prompt_task4_permissions, notion_clone_subagent_prompt_task5_app_shell, notion_clone_subagent_prompt_task6_block_editor, notion_clone_subagent_prompt_task7_page_view, notion_clone_subagent_prompt_task8_qa [EXTRACTED 1.00]
- **Task 0 Architecture Deliverable Bundle (spec/plan/tasks + downstream contracts/docs/ADR)** — specs_000_architecture_spec_doc, specs_000_architecture_plan_doc, specs_000_architecture_tasks_doc, shared_contracts_doc, docs_architecture_doc, docs_adr_0001_editor_library_tiptap [EXTRACTED 1.00]
- **Block-Editor Library Candidates Evaluated in ADR 0001** — docs_adr_0001_editor_library_tiptap, docs_adr_0001_editor_library_slatejs, docs_adr_0001_editor_library_custom_contenteditable, docs_adr_0001_editor_library_lexical [EXTRACTED 1.00]
- **Page access control flow: permissions, effective access, write gate, public share** — specs_004_collaboration_plan_pagepermission_model, specs_004_collaboration_plan_effective_access_resolution, specs_004_collaboration_plan_write_gate, specs_004_collaboration_spec_public_share_route [INFERRED 0.85]
- **Zustand persisted client-state stores (session, ui, theme)** — specs_005_app_shell_sidebar_plan_session_store, specs_005_app_shell_sidebar_plan_ui_store, specs_009_dark_mode_plan_theme_store [INFERRED 0.75]
- **App shell navigation component group** — specs_005_app_shell_sidebar_plan_appshell, specs_005_app_shell_sidebar_plan_sidebar, specs_005_app_shell_sidebar_plan_pagetree, specs_005_app_shell_sidebar_plan_workspaceswitcher, specs_005_app_shell_sidebar_plan_requireauth [EXTRACTED 1.00]
- **Slash-menu-triggered content insertion pattern (table / database / image)** — specs_011_tables_plan, specs_013_sheets_and_formulas_plan, specs_014_image_uploads_spec [INFERRED 0.80]
- **Mandatory yarn lint/typecheck/test:e2e verification gate applied across features** — specs_constitution_verification_gate, specs_011_tables_tasks, specs_012_databases_tasks, specs_013_export_tasks, specs_013_sheets_and_formulas_tasks [EXTRACTED 1.00]
- **Database–Property–PropertyValue data model reused across specs 012 and 013-sheets-and-formulas** — specs_012_databases_plan_database_model, specs_012_databases_plan_property_model, specs_012_databases_plan_propertyvalue_model, specs_013_sheets_and_formulas_plan [EXTRACTED 1.00]

## Communities (101 total, 28 thin omitted)

### Community 0 - "pages.controller.ts"
Cohesion: 0.12
Nodes (35): assertWorkspaceMember(), createPageHandler(), deletePageHandler(), duplicatePageHandler(), getAncestorsHandler(), getPageHandler(), listPagesHandler(), listTrashHandler() (+27 more)

### Community 1 - "Sidebar.tsx"
Cohesion: 0.24
Nodes (10): AppShell(), QuickSearch(), Sidebar(), applyTheme(), systemPrefersDark(), ThemeMode, ThemeState, useTheme (+2 more)

### Community 2 - "features/formulas/parser.ts"
Cohesion: 0.10
Nodes (25): AGGREGATION_FUNCTIONS, AstNode, cmp(), ComputedCell, ComputedCellStatus, evalArg(), evalBinary(), EvalContext (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (44): devDependencies, pino-pretty, prisma, tsx, @types/cheerio, @types/cookie-parser, @types/cors, @types/express (+36 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.16
Nodes (18): issueSession(), login(), refresh(), RefreshResult, register(), CommentWithUser, toUserDTO(), createUser() (+10 more)

### Community 5 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, lowlight, @notion-clone/shared, react, react-dom, react-router-dom, @tiptap/extension-placeholder, @tiptap/extension-table-header (+13 more)

### Community 6 - "scripts"
Cohesion: 0.05
Nodes (39): concurrently, eslint, eslint-config-prettier, devDependencies, concurrently, eslint, eslint-config-prettier, prettier (+31 more)

### Community 7 - "Parser"
Cohesion: 0.42
Nodes (3): AstNode, Parser, Token

### Community 8 - "Plan: Sheets & Formulas"
Cohesion: 0.10
Nodes (38): Plan: Tables in the editor, Table Serializer (blockToNode / nodeToBlocks), Table / table_row Block Model, TipTap Table Extensions (@tiptap/extension-table + row/cell/header), Spec: Tables in the editor, Tasks: Tables in the editor, Plan: Databases, Database Prisma Model (+30 more)

### Community 9 - "dependencies"
Cohesion: 0.05
Nodes (37): argon2, dependencies, argon2, cheerio, cookie-parser, cors, dotenv, express (+29 more)

### Community 10 - "api-types.ts"
Cohesion: 0.04
Nodes (50): ApiError, ApiSuccess, AttachmentDTO, BlockType, BreadcrumbsResponse, CommentDTO, ComputedCell, ComputedCellStatus (+42 more)

### Community 11 - "devDependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/node, @types/react (+13 more)

### Community 12 - "evaluator.ts"
Cohesion: 0.12
Nodes (18): FormulaError, AGGREGATION_FUNCTIONS, cmp(), describe(), evalArg(), evalBinary(), EvalContext, evaluate() (+10 more)

### Community 13 - "app.ts"
Cohesion: 0.14
Nodes (23): createApp(), pinoHttp, PinoHttpFn, csrfGuard(), requireAuth(), meRouter, blocksRouter, pageBlocksRouter (+15 more)

### Community 14 - "blocks.service.ts"
Cohesion: 0.14
Nodes (27): createBlockHandler(), deleteBlockHandler(), listBlocksHandler(), reorderBlockHandler(), updateBlockHandler(), CreateBlockInput, createBlockSchema, ReorderBlockInput (+19 more)

### Community 15 - "databases.controller.ts"
Cohesion: 0.07
Nodes (57): addPropertyHandler(), createDatabaseHandler(), createTemplateHandler(), createViewHandler(), deleteDatabaseHandler(), deletePropertyHandler(), deleteRowHandler(), deleteTemplateHandler() (+49 more)

### Community 16 - "Plan: 005 — Frontend app shell & sidebar"
Cohesion: 0.14
Nodes (23): Plan: 005 — Frontend app shell & sidebar, AppShell component, PageTree / PageTreeNode component, QuickSearch modal (Cmd/Ctrl+K), RequireAuth route guard, stores/session.ts (Zustand: user + auth actions), Sidebar component, Zustand + React Query state split (+15 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, lib, module, moduleResolution, noEmitOnError, outDir, rootDir (+12 more)

### Community 18 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, types (+12 more)

### Community 19 - "Spec: 004 — Collaboration (permissions, sharing & comments)"
Cohesion: 0.14
Nodes (21): Plan: 004 — Collaboration (permissions, sharing & comments), Comment Prisma model, Effective access resolution (accessForUser / resolveEffectiveAccess), PagePermission Prisma model, Write-gate enforcement (minAccess: EDITOR), Spec: 004 — Collaboration (permissions, sharing & comments), Public share route (GET /shared/:token), Real-time collaboration (socket.io) deferred (+13 more)

### Community 20 - "comments.controller.ts"
Cohesion: 0.23
Nodes (14): createCommentHandler(), deleteCommentHandler(), listCommentsHandler(), updateCommentHandler(), toCommentDTO(), CreateCommentInput, createCommentSchema, UpdateCommentInput (+6 more)

### Community 21 - "Editor.tsx"
Cohesion: 0.11
Nodes (16): createDatabase(), uploadImage(), updatePage(), EmojiPicker(), EMOJIS, PageHeaderProps, EditorProps, lowlight (+8 more)

### Community 23 - "shared/package.json"
Cohesion: 0.10
Nodes (19): import, types, import, types, devDependencies, typescript, exports, ./api-types (+11 more)

### Community 24 - "Plan 003 — Workspaces, Pages, Blocks, Search & Uploads"
Cohesion: 0.12
Nodes (19): Batch Block Creation via Single Transaction, AttachmentDTO, Block Endpoints, BlockDTO, Files/Attachments Endpoints, Page Endpoints, PageDTO, Search Endpoint (+11 more)

### Community 25 - "databases.ts"
Cohesion: 0.08
Nodes (47): addProperty(), addRow(), createTemplate(), createView(), deleteDatabase(), deleteProperty(), deleteRow(), deleteTemplate() (+39 more)

### Community 26 - "errors.ts"
Cohesion: 0.11
Nodes (22): Env, envSchema, parsed, getFileHandler(), uploadFileHandler(), toAttachmentDTO(), filesRouter, upload (+14 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+9 more)

### Community 28 - "import.service.ts"
Cohesion: 0.15
Nodes (22): ALLOWED, storeUpload(), importHandler(), importFile(), parseByFormat(), SUPPORTED_EXTENSIONS, extFromMime(), extractInline() (+14 more)

### Community 29 - "compilerOptions"
Cohesion: 0.12
Nodes (16): ./*.ts, compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit (+8 more)

### Community 30 - "block-schema.ts"
Cohesion: 0.18
Nodes (14): RichText, CalloutContent, CodeContent, DividerContent, HeadingContent, ImageContent, ListContent, PageRefContent (+6 more)

### Community 31 - "workspaces.controller.ts"
Cohesion: 0.29
Nodes (9): createWorkspaceHandler(), getWorkspaceHandler(), listWorkspacesHandler(), toWorkspaceDTO(), CreateWorkspaceInput, createWorkspaceSchema, createWorkspace(), getWorkspace() (+1 more)

### Community 32 - "Plan 000 — Architecture & Contracts"
Cohesion: 0.17
Nodes (16): Custom contentEditable (Rejected Alternative), Lexical (Not Considered, Deferred), Slate.js (Rejected Alternative), TipTap Chosen as Block-Editor Library, Data Model Summary (9 Tables), Architecture Overview Document, Editor Decision Cross-cutting Entry, API Contracts — Notion Clone (Single Source of Truth) (+8 more)

### Community 33 - "databases.service.ts"
Cohesion: 0.19
Nodes (27): addRowHandler(), addProperty(), addRow(), aggregate(), createView(), deleteProperty(), deleteView(), getDatabase() (+19 more)

### Community 34 - "PageTree.tsx"
Cohesion: 0.17
Nodes (15): importFile(), createPage(), deletePage(), listChildPages(), movePage(), PageTree(), PageTreeNode(), Toaster() (+7 more)

### Community 35 - "engine.ts"
Cohesion: 0.13
Nodes (15): AllValuesByName, cellCache, EvalRowInput, evaluateCell(), evaluateCellCached(), evaluateRow(), FormulaErrorCode, FormulaProperty (+7 more)

### Community 36 - "Plan 002 — Authentication & Users"
Cohesion: 0.19
Nodes (14): argon2id Password Hashing (OWASP baseline), CSRF Guard (X-Requested-With + SameSite=Lax), Auth Module README, Refresh Token Rotation on Every Refresh, UserDTO Boundary Shape (never leaks password_hash), Auth Endpoints (register/login/logout/refresh/me), CommentDTO, Comments Endpoints (+6 more)

### Community 37 - "server.ts"
Cohesion: 0.38
Nodes (5): logger, disconnectPrisma(), app, server, shutdown()

### Community 38 - "e2e/helpers.ts"
Cohesion: 0.08
Nodes (22): DbShape, loginAndCreatePage(), createFreshPageInFirstWorkspace(), CSRF_HEADER, HEADERS, JSON_HEADERS, login(), makeBlock() (+14 more)

### Community 39 - "getPrisma"
Cohesion: 0.18
Nodes (23): ACCESS_RANK, collectAncestorIds(), getAccessiblePage(), getAccessibleWorkspace(), resolveEffectiveAccess(), roleToAccess(), toTemplateDTO(), listPageDatabases() (+15 more)

### Community 40 - "Master Prompt: Notion Clone"
Cohesion: 0.32
Nodes (12): Master Prompt: Notion Clone, Spec-Driven Development Workflow Requirement, Task 0 — Architect, Task 1 — Monorepo and Environment Setup, Task 2 — Backend Authentication and Users, Task 3 — Workspaces, Pages and Blocks, Task 4 — Permissions and Collaboration, Task 5 — Frontend App Shell and Sidebar (+4 more)

### Community 41 - "serializers.ts"
Cohesion: 0.18
Nodes (17): createBlock(), deleteBlock(), updateBlock(), Editor(), blocksToDoc(), blockToNode(), DocBlock, docToBlocks() (+9 more)

### Community 42 - "ErrorBoundary"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, queryClient

### Community 43 - "Plan 001 — Monorepo & Environment Setup"
Cohesion: 0.28
Nodes (9): Postgres Docker Compose Service (Colima-compatible), Notion Clone Root README, Spec-Driven Development Pipeline, Verification Gate (lint/typecheck/test:e2e), Spec 000 — Architecture & Contracts, Plan 001 — Monorepo & Environment Setup, GET /api/v1/health Endpoint (DB-free), Spec 001 — Monorepo & Environment Setup (+1 more)

### Community 44 - "Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)"
Cohesion: 0.29
Nodes (8): Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX), DOCX Parser (mammoth + cheerio), POST /workspaces/:workspaceId/import Endpoint, Frontend Import UI (Sidebar/PageTree button + file picker), Markdown Parser (markdown-it), PDF Parser (unpdf), Spreadsheet Parser (xlsx/SheetJS), Text Parser (line-by-line)

### Community 45 - "export.controller.ts"
Cohesion: 0.40
Nodes (9): exportPageHandler(), blockToHtml(), blockToMarkdown(), escapeHtml(), richTextToHtml(), richTextToMd(), toHtml(), toMarkdown() (+1 more)

### Community 46 - "auth.controller.ts"
Cohesion: 0.21
Nodes (12): loginHandler(), logoutHandler(), meHandler(), refreshHandler(), registerHandler(), authRouter, LoginInput, loginSchema (+4 more)

### Community 48 - "App.tsx"
Cohesion: 0.33
Nodes (5): RequireAuth(), LoginPage(), RegisterPage(), SessionState, useSession

### Community 49 - "pages.ts"
Cohesion: 0.20
Nodes (12): getPage(), getPageBreadcrumbs(), listTrashedPages(), permanentDeletePage(), restorePage(), Breadcrumbs(), PageHeader(), useDocumentTitle() (+4 more)

### Community 50 - "PageAttachments.tsx"
Cohesion: 0.43
Nodes (6): AttachmentInfo, listAttachments(), fileIcon(), FileRow(), formatSize(), PageAttachments()

### Community 51 - "applyViewConfig.ts"
Cohesion: 0.38
Nodes (7): applyViewConfig(), asScalar(), compareOrd(), matches(), sortRows(), props, ViewRow

### Community 52 - "Spec: 016 — Database Templates"
Cohesion: 0.18
Nodes (10): 1. Summary, 2. Motivation / user stories, 3. Scope, 4. Developer-facing behavior, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Dependencies, 7. Open questions, In scope (+2 more)

### Community 53 - "Plan: Templates para Databases (Notion-style)"
Cohesion: 0.18
Nodes (10): Notas / no-roturas, Orden de ejecución, Plan: Templates para Databases (Notion-style), Slice 1 — Modelo de datos + migración, Slice 2 — Contratos compartidos (`shared/`), Slice 3 — Backend: servicio de templates, Slice 4 — Backend: rutas, controladores, schemas, Slice 5 — Exclusión de la Page oculta (3 puntos) (+2 more)

### Community 54 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, e2e:server:backend, e2e:server:frontend, preview, test:e2e, typecheck

### Community 55 - "Plan: 009 — Dark mode + full-height sidebar"
Cohesion: 0.47
Nodes (6): Plan: 009 — Dark mode + full-height sidebar, index.html inline anti-FOUC script, Editor CSS → CSS variables (--nc-* tokens), Full-height sidebar fix (h-full aside), Tailwind class-based dark mode strategy, stores/theme.ts (Zustand + persist, light|dark|system)

### Community 57 - "toDatabaseDTO"
Cohesion: 0.48
Nodes (6): toDatabaseDTO(), toDatabaseViewDTO(), toPropertyDTO(), toPropertyValueDTO(), toRowDTO(), updateDatabase()

### Community 58 - "frontend/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 59 - "Tasks: 016 — Database Templates"
Cohesion: 0.40
Nodes (4): Implementation, Notes, Tasks: 016 — Database Templates, Tests

### Community 60 - "BlockContent"
Cohesion: 0.50
Nodes (4): BlockDTO, CreateBlockRequest, UpdateBlockRequest, BlockContent

### Community 82 - "Spec: 014 — Databases v2 (Notion-style)"
Cohesion: 0.20
Nodes (9): 1. Summary, 2. Motivation / user stories, 3. Scope, 4. Developer-facing behavior, 5. Acceptance criteria (each testable 1:1 by e2e), 6. Slices (implementation order), In scope (delivered in 7 slices), Out of scope (documented follow-ups) (+1 more)

### Community 83 - "ast.ts"
Cohesion: 0.15
Nodes (16): Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef, StringLit (+8 more)

### Community 84 - "Databases — full Notion-style build-out"
Cohesion: 0.06
Nodes (30): Backend, Backend, Backend, Backend changes, `backend/prisma/schema.prisma`, Cross-cutting, Databases — full Notion-style build-out, Docs (+22 more)

### Community 87 - "seed.ts"
Cohesion: 0.46
Nodes (5): main(), extractText(), main(), refreshContentText(), hashPassword()

### Community 89 - "request"
Cohesion: 0.19
Nodes (13): getMe(), login(), logout(), refresh(), register(), ApiClientError, request(), createWorkspace() (+5 more)

### Community 92 - "SlashMenu.tsx"
Cohesion: 0.40
Nodes (5): getFiltered(), ITEMS, MenuItem, SlashMenu(), SlashMenuProps

## Ambiguous Edges - Review These
- `Spec: 004 — Collaboration (permissions, sharing & comments)` → `Toast store + Toaster component`  [AMBIGUOUS]
  specs/008-qa/plan.md · relation: references

## Knowledge Gaps
- **444 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+439 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Spec: 004 — Collaboration (permissions, sharing & comments)` and `Toast store + Toaster component`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getPrisma()` connect `getPrisma` to `pages.controller.ts`, `databases.service.ts`, `auth.service.ts`, `export.controller.ts`, `blocks.service.ts`, `auth.controller.ts`, `databases.controller.ts`, `app.ts`, `workspaces.controller.ts`, `comments.controller.ts`, `seed.ts`, `toDatabaseDTO`, `errors.ts`, `import.service.ts`, `search.controller.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `parseMarkdown()` connect `import.service.ts` to `dependencies`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11794871794871795 - nodes in this community are weakly interconnected._
- **Should `features/formulas/parser.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._