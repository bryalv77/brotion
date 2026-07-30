# Graph Report - .  (2026-07-30)

## Corpus Check
- 228 files · ~79,921 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1253 nodes · 2435 edges · 82 communities (64 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.8)
- Token cost: 0 input · 297,143 output

## Community Hubs (Navigation)
- Blocks CRUD API
- Databases CRUD API
- Formula Parser
- Backend Package Config
- Auth Handlers & Seed
- Frontend Dependencies
- Root Monorepo Config
- Formula AST & Lexer
- Feature Specs (Tables/Export/Sheets)
- Backend Dependencies
- Shared API Types
- Frontend Package Config
- Formula Evaluator
- Express App & Routers
- Import Parsers
- App Shell Components
- App Shell & Editor Plan
- Backend TSConfig
- Frontend TSConfig
- Collaboration & Permissions Plan
- Comments API
- Editor Block Serializers
- Page Tree & Trash
- Shared Package Config
- Workspaces/Pages/Blocks Spec
- Database View UI
- Middleware & Uploads
- Base TSConfig
- File Upload & Import Controllers
- Shared TSConfig
- Block Content Schema
- Workspaces API
- Editor Library ADR
- Editor Extensions & Databases
- Page Header & Toast UI
- Auth Middleware & Export
- Auth Module Docs
- Frontend API Client
- Sheets E2E Test
- Permissions & Search Service
- Subagent Task Prompts
- Env & Server Bootstrap
- Error Boundary & Query Client
- Root README & Setup Spec
- Import Feature Plan
- Export Service (MD/HTML/PDF)
- Attachments UI
- Workspace Switcher UI
- Pages E2E Test
- Page View Components
- Collaboration E2E Test
- Page Databases UI
- Slash Menu Component
- Auth E2E Test
- ScaffoldGen Generator Plan
- Dark Mode Plan
- Images E2E Test
- Workspaces E2E Test
- Health Check Endpoint
- Import E2E Test
- Block DTO Types
- Express Type Augmentation
- Editor E2E Test
- Export E2E Test
- QA E2E Test
- UI E2E Test
- HTML Entry & FOUC Script
- Permission DTO & Endpoint
- Real-time Socket Events
- Task 005 Checklist
- Task 006 Checklist
- Task 007 Checklist
- Task 008 Checklist
- Task 009 Checklist

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 75 edges
2. `getAccessiblePage()` - 41 edges
3. `ok()` - 36 edges
4. `request()` - 36 edges
5. `badRequest()` - 24 edges
6. `notFound()` - 22 edges
7. `created()` - 22 edges
8. `requireAuth()` - 17 edges
9. `Parser` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Generated Web Stack (React+Vite+shadcn/ui+TanStack Query)` --semantically_similar_to--> `Plan 000 — Architecture & Contracts`  [INFERRED] [semantically similar]
  scaffoldgen-tasks (1).md → specs/000-architecture/plan.md
- `Generated API Stack (Express+Prisma+Postgres+JWT)` --semantically_similar_to--> `Plan 000 — Architecture & Contracts`  [INFERRED] [semantically similar]
  scaffoldgen-tasks (1).md → specs/000-architecture/plan.md
- `Spec 003 — Workspaces, Pages, Blocks, Search & Uploads` --references--> `Task 3 — Workspaces, Pages and Blocks`  [INFERRED]
  specs/003-workspaces-pages-blocks/spec.md → notion-clone-subagent-prompt.md
- `asyncHandler Wrapper Pattern (Express 4 async crash fix)` --references--> `Auth Module README`  [INFERRED]
  specs/002-auth/tasks.md → backend/src/modules/auth/README.md
- `Spec 001 — Monorepo & Environment Setup` --references--> `Task 1 — Monorepo and Environment Setup`  [INFERRED]
  specs/001-setup/spec.md → notion-clone-subagent-prompt.md

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

## Communities (82 total, 18 thin omitted)

### Community 0 - "Blocks CRUD API"
Cohesion: 0.07
Nodes (63): assertWorkspaceMember(), createBlockHandler(), deleteBlockHandler(), listBlocksHandler(), reorderBlockHandler(), updateBlockHandler(), CreateBlockInput, createBlockSchema (+55 more)

### Community 1 - "Databases CRUD API"
Cohesion: 0.07
Nodes (57): getAccessiblePage(), addPropertyHandler(), addRowHandler(), createDatabaseHandler(), deleteDatabaseHandler(), getDatabaseHandler(), listPageDatabasesHandler(), updateDatabaseHandler() (+49 more)

### Community 2 - "Formula Parser"
Cohesion: 0.09
Nodes (27): AGGREGATION_FUNCTIONS, AstNode, cmp(), ComputedCell, ComputedCellStatus, evalArg(), evalBinary(), EvalContext (+19 more)

### Community 3 - "Backend Package Config"
Cohesion: 0.05
Nodes (43): devDependencies, pino-pretty, prisma, tsx, @types/cheerio, @types/cookie-parser, @types/cors, @types/express (+35 more)

### Community 4 - "Auth Handlers & Seed"
Cohesion: 0.09
Nodes (34): extractText(), main(), refreshContentText(), loginHandler(), logoutHandler(), meHandler(), refreshHandler(), registerHandler() (+26 more)

### Community 5 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (43): dependencies, lowlight, @notion-clone/shared, react, react-dom, react-router-dom, @tanstack/react-query, @tiptap/extension-code-block-lowlight (+35 more)

### Community 6 - "Root Monorepo Config"
Cohesion: 0.05
Nodes (39): concurrently, eslint, eslint-config-prettier, devDependencies, concurrently, eslint, eslint-config-prettier, prettier (+31 more)

### Community 7 - "Formula AST & Lexer"
Cohesion: 0.14
Nodes (19): AstNode, Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef (+11 more)

### Community 8 - "Feature Specs (Tables/Export/Sheets)"
Cohesion: 0.10
Nodes (38): Plan: Tables in the editor, Table Serializer (blockToNode / nodeToBlocks), Table / table_row Block Model, TipTap Table Extensions (@tiptap/extension-table + row/cell/header), Spec: Tables in the editor, Tasks: Tables in the editor, Plan: Databases, Database Prisma Model (+30 more)

### Community 9 - "Backend Dependencies"
Cohesion: 0.05
Nodes (37): argon2, dependencies, argon2, cheerio, cookie-parser, cors, dotenv, express (+29 more)

### Community 10 - "Shared API Types"
Cohesion: 0.06
Nodes (35): ApiError, ApiSuccess, AttachmentDTO, BlockType, CommentDTO, ComputedCell, ComputedCellStatus, CreateCommentRequest (+27 more)

### Community 11 - "Frontend Package Config"
Cohesion: 0.06
Nodes (33): autoprefixer, devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/node, @types/react (+25 more)

### Community 12 - "Formula Evaluator"
Cohesion: 0.12
Nodes (18): FormulaError, AGGREGATION_FUNCTIONS, cmp(), describe(), evalArg(), evalBinary(), EvalContext, evaluate() (+10 more)

### Community 13 - "Express App & Routers"
Cohesion: 0.13
Nodes (19): createApp(), pinoHttp, PinoHttpFn, authRouter, meRouter, blocksRouter, pageBlocksRouter, databasesRouter (+11 more)

### Community 14 - "Import Parsers"
Cohesion: 0.18
Nodes (18): parseByFormat(), SUPPORTED_EXTENSIONS, extFromMime(), extractInline(), htmlToBlocks(), parseDocx(), parseHtmlTable(), findInline() (+10 more)

### Community 15 - "App Shell Components"
Cohesion: 0.15
Nodes (15): AppShell(), QuickSearch(), RequireAuth(), Sidebar(), LoginPage(), RegisterPage(), SessionState, useSession (+7 more)

### Community 16 - "App Shell & Editor Plan"
Cohesion: 0.14
Nodes (23): Plan: 005 — Frontend app shell & sidebar, AppShell component, PageTree / PageTreeNode component, QuickSearch modal (Cmd/Ctrl+K), RequireAuth route guard, stores/session.ts (Zustand: user + auth actions), Sidebar component, Zustand + React Query state split (+15 more)

### Community 17 - "Backend TSConfig"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, lib, module, moduleResolution, noEmitOnError, outDir, rootDir (+12 more)

### Community 18 - "Frontend TSConfig"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, types (+12 more)

### Community 19 - "Collaboration & Permissions Plan"
Cohesion: 0.14
Nodes (21): Plan: 004 — Collaboration (permissions, sharing & comments), Comment Prisma model, Effective access resolution (accessForUser / resolveEffectiveAccess), PagePermission Prisma model, Write-gate enforcement (minAccess: EDITOR), Spec: 004 — Collaboration (permissions, sharing & comments), Public share route (GET /shared/:token), Real-time collaboration (socket.io) deferred (+13 more)

### Community 20 - "Comments API"
Cohesion: 0.20
Nodes (16): createCommentHandler(), deleteCommentHandler(), listCommentsHandler(), updateCommentHandler(), toCommentDTO(), commentsRouter, pageCommentsRouter, CreateCommentInput (+8 more)

### Community 21 - "Editor Block Serializers"
Cohesion: 0.18
Nodes (17): createBlock(), deleteBlock(), updateBlock(), Editor(), blocksToDoc(), blockToNode(), DocBlock, docToBlocks() (+9 more)

### Community 22 - "Page Tree & Trash"
Cohesion: 0.22
Nodes (13): importFile(), createPage(), deletePage(), listChildPages(), listTrashedPages(), permanentDeletePage(), restorePage(), PageTree() (+5 more)

### Community 23 - "Shared Package Config"
Cohesion: 0.10
Nodes (19): import, types, import, types, devDependencies, typescript, exports, ./api-types (+11 more)

### Community 24 - "Workspaces/Pages/Blocks Spec"
Cohesion: 0.12
Nodes (19): Batch Block Creation via Single Transaction, AttachmentDTO, Block Endpoints, BlockDTO, Files/Attachments Endpoints, Page Endpoints, PageDTO, Search Endpoint (+11 more)

### Community 25 - "Database View UI"
Cohesion: 0.21
Nodes (16): addProperty(), addRow(), deleteDatabase(), getDatabase(), updateProperty(), updatePropertyValue(), allValuesByName(), DatabaseView() (+8 more)

### Community 26 - "Middleware & Uploads"
Cohesion: 0.20
Nodes (12): logger, csrfGuard(), filesRouter, upload, uploadSingle(), importRouter, upload, uploadImportFile() (+4 more)

### Community 27 - "Base TSConfig"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+9 more)

### Community 28 - "File Upload & Import Controllers"
Cohesion: 0.26
Nodes (12): getFileHandler(), uploadFileHandler(), toAttachmentDTO(), ALLOWED, resolveStoragePath(), STORAGE_DIR, storeUpload(), UploadInput (+4 more)

### Community 29 - "Shared TSConfig"
Cohesion: 0.12
Nodes (16): ./*.ts, compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit (+8 more)

### Community 30 - "Block Content Schema"
Cohesion: 0.18
Nodes (14): RichText, CalloutContent, CodeContent, DividerContent, HeadingContent, ImageContent, ListContent, PageRefContent (+6 more)

### Community 31 - "Workspaces API"
Cohesion: 0.25
Nodes (11): getAccessibleWorkspace(), createWorkspaceHandler(), getWorkspaceHandler(), listWorkspacesHandler(), toWorkspaceDTO(), workspacesRouter, CreateWorkspaceInput, createWorkspaceSchema (+3 more)

### Community 32 - "Editor Library ADR"
Cohesion: 0.17
Nodes (16): Custom contentEditable (Rejected Alternative), Lexical (Not Considered, Deferred), Slate.js (Rejected Alternative), TipTap Chosen as Block-Editor Library, Data Model Summary (9 Tables), Architecture Overview Document, Editor Decision Cross-cutting Entry, API Contracts — Notion Clone (Single Source of Truth) (+8 more)

### Community 33 - "Editor Extensions & Databases"
Cohesion: 0.17
Nodes (11): createDatabase(), EditorProps, lowlight, PMNode, Callout, Commands, @tiptap/core, Commands (+3 more)

### Community 34 - "Page Header & Toast UI"
Cohesion: 0.18
Nodes (10): uploadImage(), updatePage(), EmojiPicker(), EMOJIS, PageHeader(), PageHeaderProps, Toaster(), Toast (+2 more)

### Community 35 - "Auth Middleware & Export"
Cohesion: 0.24
Nodes (9): requireAuth(), exportPageHandler(), exportRouter, toMarkdown(), findUserById(), accessSecret(), AccessTokenPayload, signAccessToken() (+1 more)

### Community 36 - "Auth Module Docs"
Cohesion: 0.19
Nodes (14): argon2id Password Hashing (OWASP baseline), CSRF Guard (X-Requested-With + SameSite=Lax), Auth Module README, Refresh Token Rotation on Every Refresh, UserDTO Boundary Shape (never leaks password_hash), Auth Endpoints (register/login/logout/refresh/me), CommentDTO, Comments Endpoints (+6 more)

### Community 37 - "Frontend API Client"
Cohesion: 0.27
Nodes (9): getMe(), login(), logout(), refresh(), register(), ApiClientError, request(), createWorkspace() (+1 more)

### Community 39 - "Permissions & Search Service"
Cohesion: 0.24
Nodes (7): ACCESS_RANK, collectAncestorIds(), resolveEffectiveAccess(), roleToAccess(), searchHandler(), searchRouter, searchPages()

### Community 40 - "Subagent Task Prompts"
Cohesion: 0.32
Nodes (12): Master Prompt: Notion Clone, Spec-Driven Development Workflow Requirement, Task 0 — Architect, Task 1 — Monorepo and Environment Setup, Task 2 — Backend Authentication and Users, Task 3 — Workspaces, Pages and Blocks, Task 4 — Permissions and Collaboration, Task 5 — Frontend App Shell and Sidebar (+4 more)

### Community 41 - "Env & Server Bootstrap"
Cohesion: 0.27
Nodes (7): Env, envSchema, parsed, disconnectPrisma(), app, server, shutdown()

### Community 42 - "Error Boundary & Query Client"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, queryClient

### Community 43 - "Root README & Setup Spec"
Cohesion: 0.28
Nodes (9): Postgres Docker Compose Service (Colima-compatible), Notion Clone Root README, Spec-Driven Development Pipeline, Verification Gate (lint/typecheck/test:e2e), Spec 000 — Architecture & Contracts, Plan 001 — Monorepo & Environment Setup, GET /api/v1/health Endpoint (DB-free), Spec 001 — Monorepo & Environment Setup (+1 more)

### Community 44 - "Import Feature Plan"
Cohesion: 0.29
Nodes (8): Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX), DOCX Parser (mammoth + cheerio), POST /workspaces/:workspaceId/import Endpoint, Frontend Import UI (Sidebar/PageTree button + file picker), Markdown Parser (markdown-it), PDF Parser (unpdf), Spreadsheet Parser (xlsx/SheetJS), Text Parser (line-by-line)

### Community 45 - "Export Service (MD/HTML/PDF)"
Cohesion: 0.50
Nodes (7): blockToHtml(), blockToMarkdown(), escapeHtml(), richTextToHtml(), richTextToMd(), toHtml(), toPdf()

### Community 46 - "Attachments UI"
Cohesion: 0.43
Nodes (6): AttachmentInfo, listAttachments(), fileIcon(), FileRow(), formatSize(), PageAttachments()

### Community 47 - "Workspace Switcher UI"
Cohesion: 0.43
Nodes (4): listWorkspaces(), WorkspaceIndex(), WorkspaceSwitcher(), useWorkspaces()

### Community 49 - "Page View Components"
Cohesion: 0.48
Nodes (4): getPage(), useDocumentTitle(), PageView(), PageViewStub()

### Community 51 - "Page Databases UI"
Cohesion: 0.53
Nodes (4): listPageDatabases(), PageDatabases(), PageDatabasesProps, usePageDatabases()

### Community 52 - "Slash Menu Component"
Cohesion: 0.40
Nodes (5): getFiltered(), ITEMS, MenuItem, SlashMenu(), SlashMenuProps

### Community 53 - "Auth E2E Test"
Cohesion: 0.47
Nodes (4): JSON_HEADERS, parseBody(), post(), ApiResponse

### Community 54 - "ScaffoldGen Generator Plan"
Cohesion: 0.33
Nodes (6): ScaffoldGen — Full Development Plan, Generated API Stack (Express+Prisma+Postgres+JWT), Generated Native Stack (Expo+NativeWind), Generated Web Stack (React+Vite+shadcn/ui+TanStack Query), Template Generator Engine (Handlebars + JSZip), ProjectSchema/EntityDefinition Type Model

### Community 55 - "Dark Mode Plan"
Cohesion: 0.47
Nodes (6): Plan: 009 — Dark mode + full-height sidebar, index.html inline anti-FOUC script, Editor CSS → CSS variables (--nc-* tokens), Full-height sidebar fix (h-full aside), Tailwind class-based dark mode strategy, stores/theme.ts (Zustand + persist, light|dark|system)

### Community 56 - "Images E2E Test"
Cohesion: 0.50
Nodes (4): HEADERS, registerAndCreatePage(), TINY_PNG, uniq()

### Community 59 - "Import E2E Test"
Cohesion: 0.67
Nodes (3): HEADERS, setup(), uniq()

### Community 60 - "Block DTO Types"
Cohesion: 0.50
Nodes (4): BlockDTO, CreateBlockRequest, UpdateBlockRequest, BlockContent

## Ambiguous Edges - Review These
- `Spec: 004 — Collaboration (permissions, sharing & comments)` → `Toast store + Toaster component`  [AMBIGUOUS]
  specs/008-qa/plan.md · relation: references

## Knowledge Gaps
- **374 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+369 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Spec: 004 — Collaboration (permissions, sharing & comments)` and `Toast store + Toaster component`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getPrisma()` connect `Blocks CRUD API` to `Databases CRUD API`, `Auth Middleware & Export`, `Auth Handlers & Seed`, `Permissions & Search Service`, `Env & Server Bootstrap`, `Express App & Routers`, `Import Parsers`, `Comments API`, `File Upload & Import Controllers`, `Workspaces API`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Backend Package Config`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Backend Dependencies` to `Import Parsers`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _374 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blocks CRUD API` be split into smaller, more focused modules?**
  _Cohesion score 0.07279562542720437 - nodes in this community are weakly interconnected._
- **Should `Databases CRUD API` be split into smaller, more focused modules?**
  _Cohesion score 0.06905370843989769 - nodes in this community are weakly interconnected._