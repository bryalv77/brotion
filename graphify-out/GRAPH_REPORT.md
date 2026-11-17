# Graph Report - notion-clone  (2026-11-17)

## Corpus Check
- 251 files · ~92,558 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 34 file(s) not represented in the graph (top: .sqlite 7, .sqlite-shm 7, .sqlite-wal 7)

## Summary
- 1624 nodes · 4186 edges · 96 communities (73 shown, 23 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.85)
- Token cost: 0 input · 297,143 output

## Graph Freshness
- Built from commit: `26a23d73`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkspaceSwitcher.tsx
- databases.service.ts
- routes/auth.ts
- backend/package.json
- react-native
- api/me.ts
- scripts
- routes/workspaces.ts
- auth.service.ts
- backend/package.json
- api-types.ts
- frontend/package.json
- engine.ts
- tailwindcss
- blocks.service.ts
- routes/databases.ts
- http/types.ts
- compilerOptions
- compilerOptions
- api/workspaces.ts
- registry/types.ts
- data/databases.ts
- expo-file-system@*
- shared/package.json
- import.ts
- request
- getPrisma
- compilerOptions
- docx.ts
- compilerOptions
- app.ts
- utils/errors.ts
- routes/blocks.ts
- FilterSortBar.tsx
- api/client.ts
- expo-sharing@*
- markdown.ts
- applyViewConfig.ts
- 7. PHASE C — DATABASE SYSTEM
- ui.tsx
- api/helpers.ts
- frontend/features/editor/Editor.tsx
- devDependencies
- Notion Clone Root README
- @playwright/test
- export.service.ts
- pages.service.ts
- generate-icons.mjs
- expo-status-bar
- frontend/components/db/CellEditor.tsx
- LocalStore
- [pageId].tsx
- features_plan.md
- local/databases.ts
- scripts
- templates.spec.ts
- 4. MULTI-AGENT ORCHESTRATION
- auth/permissions.service.ts
- prepare-pages.js
- 6. PHASE B — BLOCK-BASED CONTENT EDITOR
- sheets.spec.ts
- C4. Database Views
- expo
- 13. DEFINITION OF DONE
- dependencies
- release-ios.mjs
- 5. PHASE A — PAGES AND CONTENT ORGANIZATION
- 8. PHASE D — CROSS-FEATURE INTEGRATION
- Testing layers
- B2. Required Block Types
- DebouncedFn
- frontend/stores/theme.ts
- databases.spec.ts
- adopt.service.ts
- 3. PHASE 0 — REPOSITORY DISCOVERY AND ARCHITECTURAL AUDIT
- @expo/metro-runtime@*
- react-native-screens@*
- expo-sqlite
- react-native-safe-area-context@*
- react-native-svg@15.16.0
- react-native-web@0.21.4
- secureStore.web.ts
- misc.ts
- scripts
- password.ts
- AGENTS.md
- register
- uploads.ts
- metro.config.js

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 103 edges
2. `getAccessiblePage()` - 54 edges
3. `request()` - 52 edges
4. `getLocalStore()` - 51 edges
5. `notFound()` - 39 edges
6. `LocalStore` - 34 edges
7. `badRequest()` - 33 edges
8. `react-native` - 32 edges
9. `Button()` - 25 edges
10. `Muted()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `TplBlockNode` --references--> `RichText`  [EXTRACTED]
  backend/src/modules/page-templates/registry/types.ts → shared/api-types.ts
- `TplPropertyDefinition` --references--> `PropertyType`  [EXTRACTED]
  backend/src/modules/page-templates/registry/types.ts → shared/api-types.ts
- `TplViewDefinition` --references--> `ViewType`  [EXTRACTED]
  backend/src/modules/page-templates/registry/types.ts → shared/api-types.ts
- `SessionState` --references--> `UserDTO`  [EXTRACTED]
  frontend/lib/session.ts → shared/api-types.ts
- `addProperty()` --calls--> `normalizeSelectOptions()`  [EXTRACTED]
  backend/src/modules/databases/databases.service.ts → shared/propertyOptions.ts

## Import Cycles
- 2-file cycle: `shared/applyViewConfig.ts -> shared/index.ts -> shared/applyViewConfig.ts`

## Communities (96 total, 23 thin omitted)

### Community 0 - "WorkspaceSwitcher.tsx"
Cohesion: 0.12
Nodes (27): WorkspaceIndex(), WorkspaceView(), PageTree(), handleCreate(), PageTreeNode(), handleAddSubpage(), workspaceIdFromPath(), WorkspaceSwitcher() (+19 more)

### Community 1 - "databases.service.ts"
Cohesion: 0.17
Nodes (21): addProperty(), createView(), deleteDatabase(), deleteProperty(), deleteRow(), deleteView(), getDatabase(), loadAllValuesByName() (+13 more)

### Community 2 - "routes/auth.ts"
Cohesion: 0.14
Nodes (19): C, clearSessionCookies(), setSessionCookies(), authRoutes, isNative(), sessionBody(), LoginInput, loginSchema (+11 more)

### Community 3 - "backend/package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @cloudflare/workers-types@^5.20261116.1, pino-pretty@^11.3.0, prisma@^5.22.0, tsx@^4.19.2, @types/markdown-it@^14.1.2, @types/node@^22.9.0, typescript@^5.6.3 (+16 more)

### Community 4 - "react-native"
Cohesion: 0.11
Nodes (24): AppShell(), PageTreeProps, plainSnippet(), QuickSearch(), close(), select(), useSearchResults(), workspaceIdFromPath() (+16 more)

### Community 5 - "api/me.ts"
Cohesion: 0.47
Nodes (4): adoptLocal(), adoptLocalData(), AdoptLocalRequest, AdoptLocalResponse

### Community 6 - "scripts"
Cohesion: 0.06
Nodes (38): devDependencies, concurrently@^8.2.2, eslint@^8.57.1, eslint-config-prettier@^9.1.0, prettier@^3.3.3, typescript@^5.6.3, @typescript-eslint/eslint-plugin@^7.18.0, @typescript-eslint/parser@^7.18.0 (+30 more)

### Community 7 - "routes/workspaces.ts"
Cohesion: 0.33
Nodes (7): workspacesRoutes, toWorkspaceDTO(), CreateWorkspaceInput, createWorkspaceSchema, createWorkspace(), getWorkspace(), listWorkspacesForUser()

### Community 8 - "auth.service.ts"
Cohesion: 0.16
Nodes (22): requireAuth, getCurrentUser(), IssuedSession, issueSession(), login(), refresh(), RefreshResult, register() (+14 more)

### Community 9 - "backend/package.json"
Cohesion: 0.08
Nodes (25): dependencies, dotenv@^16.4.7, hono@^4.13.19, @hono/node-server@^2.1.9, jose@^6.2.17, markdown-it@^14.3.0, @neondatabase/serverless@0.10.4, @notion-clone/shared@0.1.0 (+17 more)

### Community 10 - "api-types.ts"
Cohesion: 0.06
Nodes (47): AdoptLocalDatabase, AdoptLocalValue, ApiSuccess, BreadcrumbsResponse, CommentDTO, ComputedCellStatus, CreateBlockRequest, CreateCommentRequest (+39 more)

### Community 11 - "frontend/package.json"
Cohesion: 0.12
Nodes (16): expo-document-picker@*, expo-linking@*, @notion-clone/shared@0.1.0, react-native-gesture-handler@~3.3.0, react-native-reanimated@*, react-native-worklets@0.13.0, @notion-clone/shared, main (+8 more)

### Community 12 - "engine.ts"
Cohesion: 0.05
Nodes (57): AstNode, Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef (+49 more)

### Community 14 - "blocks.service.ts"
Cohesion: 0.24
Nodes (16): createBlock(), deleteBlock(), isDescendant(), listBlocks(), loadBlockInAccessiblePage(), reorderBlock(), resolveAnchors(), updateBlock() (+8 more)

### Community 15 - "routes/databases.ts"
Cohesion: 0.09
Nodes (33): toDatabaseDTO(), toDatabaseViewDTO(), toPropertyDTO(), toPropertyValueDTO(), toRowDTO(), CreateDatabaseInput, createDatabaseSchema, CreatePropertyInput (+25 more)

### Community 16 - "http/types.ts"
Cohesion: 0.33
Nodes (6): AppBindings, FileBucket, runWithPrisma(), Env, initWorkerEnv(), fetch()

### Community 17 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, lib, module, moduleResolution, noEmitOnError, outDir, rootDir (+6 more)

### Community 18 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, baseUrl, moduleResolution, noEmit, paths, strict, types (+4 more)

### Community 19 - "api/workspaces.ts"
Cohesion: 0.40
Nodes (4): createWorkspace(), getWorkspace(), listWorkspaces(), CreateWorkspaceRequest

### Community 20 - "registry/types.ts"
Cohesion: 0.08
Nodes (22): contentPlannerTemplate, crmTemplate, financeTrackerTemplate, habitTrackerTemplate, ALL_PAGE_TEMPLATES, knowledgeBaseTemplate, projectManagementTemplate, readingListTemplate (+14 more)

### Community 21 - "data/databases.ts"
Cohesion: 0.13
Nodes (14): addProperty, createTemplate, createView, deleteDatabase, deleteProperty, deleteTemplate, deleteView, getDatabase (+6 more)

### Community 23 - "shared/package.json"
Cohesion: 0.08
Nodes (27): import, types, import, types, devDependencies, tsx@^4.19.2, @types/node@^22.9.0, typescript@^5.6.3 (+19 more)

### Community 24 - "import.ts"
Cohesion: 0.15
Nodes (11): env, Env, envSchema, parsed, diskBucket(), disconnectPrisma(), requestScope, app (+3 more)

### Community 25 - "request"
Cohesion: 0.12
Nodes (30): request(), addProperty(), addRow(), createDatabase(), createTemplate(), createView(), deleteDatabase(), deleteProperty() (+22 more)

### Community 26 - "getPrisma"
Cohesion: 0.18
Nodes (28): getAccessiblePage(), toCommentDTO(), createComment(), deleteComment(), listComments(), loadCommentInAccessiblePage(), updateComment(), toTemplateDTO() (+20 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 28 - "docx.ts"
Cohesion: 0.18
Nodes (11): cheerio@^1.2.0, mammoth@^1.12.0, extFromMime(), extractInline(), htmlToBlocks(), runsFromElement(), parseDocx(), parseHtmlTable() (+3 more)

### Community 29 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit, outDir (+6 more)

### Community 30 - "app.ts"
Cohesion: 0.10
Nodes (34): createApp(), C, created(), errorResponse(), noContent(), ok(), optionalJson(), commentsRoutes (+26 more)

### Community 31 - "utils/errors.ts"
Cohesion: 0.14
Nodes (15): LogFn, logger, LoggerLike, csrfGuard, toAttachmentDTO(), ALLOWED, extOf(), isValidStorageKey() (+7 more)

### Community 32 - "routes/blocks.ts"
Cohesion: 0.10
Nodes (18): zod@^3.23.8, blocksRoutes, pageBlocksRoutes, CreateBlockInput, createBlockSchema, ReorderBlockInput, reorderBlockSchema, UpdateBlockInput (+10 more)

### Community 33 - "FilterSortBar.tsx"
Cohesion: 0.21
Nodes (5): FILTER_OPS, FilterSortBar(), filterValueText(), Chip(), updateView

### Community 34 - "api/client.ts"
Cohesion: 0.10
Nodes (20): AuthResponse, getMe(), login(), logout(), register(), createBlock(), deleteBlock(), updateBlock() (+12 more)

### Community 36 - "markdown.ts"
Cohesion: 0.23
Nodes (12): parseByFormat(), SUPPORTED_EXTENSIONS, findInline(), inlineTokenToRichText(), md, parseMarkdown(), parseTableTokens(), parsePdf() (+4 more)

### Community 37 - "applyViewConfig.ts"
Cohesion: 0.29
Nodes (9): Filter, Sort, applyViewConfig(), asScalar(), compareOrd(), matches(), sortRows(), props (+1 more)

### Community 38 - "7. PHASE C — DATABASE SYSTEM"
Cohesion: 0.15
Nodes (13): 7. PHASE C — DATABASE SYSTEM, Acceptance criteria for Phase C, C10. Formula Engine, C11. Linked Database Views, C12. Database Templates, C1. Database Architecture, C2. Database Properties, C3. Database Records (+5 more)

### Community 39 - "ui.tsx"
Cohesion: 0.22
Nodes (17): AppLayout(), RootLayout(), LoginScreen(), RegisterScreen(), ReconnectScreen(), Button(), ErrorBanner(), H1() (+9 more)

### Community 40 - "api/helpers.ts"
Cohesion: 0.26
Nodes (8): NOW, DEMO_EMAIL, DEMO_PASSWORD, HEADERS, JSON_HEADERS, login(), parseBody(), postJson()

### Community 41 - "frontend/features/editor/Editor.tsx"
Cohesion: 0.14
Nodes (21): BlockRow(), updateImage(), BlockRowProps, TEXT_STYLES, blockToText(), isRecord(), makeBlock(), richTextToPlainText() (+13 more)

### Community 42 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @playwright/test@^1.48.2, @types/node@^22.9.0, @types/react@^19.0.0, typescript@^5.6.3, @types/node, typescript, @types/react

### Community 43 - "Notion Clone Root README"
Cohesion: 0.67
Nodes (3): Notion Clone Root README, Spec-Driven Development Pipeline, Verification Gate (lint/typecheck/test:e2e)

### Community 44 - "@playwright/test"
Cohesion: 0.20
Nodes (3): ROOT, HEADERS, @playwright/test

### Community 45 - "export.service.ts"
Cohesion: 0.39
Nodes (7): exportRoutes, blockPlainText(), blockToMarkdown(), richTextToMd(), sanitize(), toMarkdown(), toPdf()

### Community 46 - "pages.service.ts"
Cohesion: 0.14
Nodes (25): assertWorkspaceMember(), importFile(), createBlockTree(), instantiatePageTemplate(), isRelationValue(), listPageTemplates(), resolveBlockContent(), findPageTemplate() (+17 more)

### Community 47 - "generate-icons.mjs"
Cohesion: 0.21
Nodes (9): BG, chunk(), crc32(), CRC_TABLE, __dirname, draw(), encodePng(), FG (+1 more)

### Community 49 - "frontend/components/db/CellEditor.tsx"
Cohesion: 0.18
Nodes (30): ViewProps, VIEWS, BoardView(), CellEditor(), CellEditorProps, GalleryView(), colorFor(), displayCellText() (+22 more)

### Community 50 - "LocalStore"
Cohesion: 0.06
Nodes (10): openIdbKV(), getLocalKV(), getLocalKV(), getLocalKV(), KV, openSqliteKV(), LocalSnapshot, LocalStore (+2 more)

### Community 51 - "[pageId].tsx"
Cohesion: 0.20
Nodes (22): PageScreen(), TrashScreen(), DatabaseView(), TemplatesModal(), PageAttachments(), PageDatabases(), Divider(), H2() (+14 more)

### Community 52 - "features_plan.md"
Cohesion: 0.18
Nodes (10): 10. PHASE F — UX, PERFORMANCE AND SECURITY, 11. IMPLEMENTATION STRATEGY, 12. TASK MANAGEMENT AND PROGRESS TRACKING, 14. FINAL EXECUTION INSTRUCTIONS, 1. ROLE AND MISSION, 2. GLOBAL CONSTRAINTS, MASTER PROMPT: Implement a docs-Inspired Personal Workspace MVP, Performance requirements (+2 more)

### Community 53 - "local/databases.ts"
Cohesion: 0.06
Nodes (80): isAllowedOrigin(), updateLanguage(), ApiClientError, createBlock(), deleteBlock(), updateBlock(), addProperty(), addRow() (+72 more)

### Community 54 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android, build:web, dev, e2e:server:backend, e2e:server:frontend, ios, release:ios (+5 more)

### Community 56 - "4. MULTI-AGENT ORCHESTRATION"
Cohesion: 0.22
Nodes (9): 4. MULTI-AGENT ORCHESTRATION, Agent 1 — Architecture and Data Modeling, Agent 2 — Pages and Navigation, Agent 3 — Block Editor, Agent 4 — Database Engine, Agent 5 — Frontend UX and Design System, Agent 6 — QA and TDD, Agent 7 — Integration and Code Review (+1 more)

### Community 57 - "auth/permissions.service.ts"
Cohesion: 0.38
Nodes (5): ACCESS_RANK, collectAncestorIds(), getAccessibleWorkspace(), resolveEffectiveAccess(), roleToAccess()

### Community 58 - "prepare-pages.js"
Cohesion: 0.22
Nodes (8): workbox-build@^7.4.1, copies, dist, fs, generateServiceWorker(), path, scriptsDir, workbox-build

### Community 59 - "6. PHASE B — BLOCK-BASED CONTENT EDITOR"
Cohesion: 0.25
Nodes (8): 6. PHASE B — BLOCK-BASED CONTENT EDITOR, Acceptance criteria for Phase B, B1. Core Block Architecture, B3. Text Formatting, B4. Block Manipulation, B5. Editor Experience, B6. Media Handling, B7. Tables of Contents and Layout

### Community 61 - "C4. Database Views"
Cohesion: 0.29
Nodes (7): Board View, C4. Database Views, Calendar View, Gallery View, List View, Table View, Timeline View

### Community 62 - "expo"
Cohesion: 0.10
Nodes (19): edgeToEdge, package, typedRoutes, expo, android, experiments, ios, name (+11 more)

### Community 64 - "13. DEFINITION OF DONE"
Cohesion: 0.33
Nodes (6): 13. DEFINITION OF DONE, Area A — Pages, Area B — Editor, Area C — Databases, Integration, Quality

### Community 65 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, expo-constants@*, expo-image-picker@*, expo-router@~58.0.31, expo-secure-store@*, idb@^8.0.4, lucide-react-native@^1.74.0, @paralleldrive/cuid2@^3.3.0 (+11 more)

### Community 66 - "release-ios.mjs"
Cohesion: 0.11
Nodes (17): app, appJson, appJsonPath, archive, auth, d, exportDir, exported (+9 more)

### Community 67 - "5. PHASE A — PAGES AND CONTENT ORGANIZATION"
Cohesion: 0.33
Nodes (6): 5. PHASE A — PAGES AND CONTENT ORGANIZATION, A1. Page Management, A2. Hierarchical Pages, A3. Navigation, A4. Search, A5. Templates

### Community 68 - "8. PHASE D — CROSS-FEATURE INTEGRATION"
Cohesion: 0.33
Nodes (6): 8. PHASE D — CROSS-FEATURE INTEGRATION, Workflow 1: Personal workspace, Workflow 2: Document creation, Workflow 3: Personal task manager, Workflow 4: Personal knowledge database, Workflow 5: Integrated dashboard

### Community 69 - "Testing layers"
Cohesion: 0.33
Nodes (6): 9. PHASE E — TEST-DRIVEN DEVELOPMENT, End-to-end tests, Integration tests, Regression testing, Testing layers, Unit tests

### Community 70 - "B2. Required Block Types"
Cohesion: 0.33
Nodes (6): B2. Required Block Types, Interactive blocks, Layout blocks, Media blocks, Technical blocks, Text blocks

### Community 73 - "frontend/stores/theme.ts"
Cohesion: 0.17
Nodes (11): TemplatePrefsState, useTemplatePrefs, secureStore, sessionFlag, StoredTokens, tokenStorage, appStorage, ThemeMode (+3 more)

### Community 75 - "adopt.service.ts"
Cohesion: 0.21
Nodes (11): AdoptLocalInput, adoptLocalSchema, isoString, adoptLocalData(), AdoptResult, BLOCK_TYPES, date(), json() (+3 more)

### Community 76 - "3. PHASE 0 — REPOSITORY DISCOVERY AND ARCHITECTURAL AUDIT"
Cohesion: 0.50
Nodes (4): 3. PHASE 0 — REPOSITORY DISCOVERY AND ARCHITECTURAL AUDIT, Application architecture, Deliverables, Existing capabilities

### Community 85 - "misc.ts"
Cohesion: 0.19
Nodes (7): AttachmentInfo, listAttachments(), instantiatePageTemplate(), listPageTemplates(), instantiatePageTemplate(), PAGE_TEMPLATES, PageTemplateSummaryDTO

### Community 86 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:worker, dev, postinstall, prisma:deploy, prisma:generate, prisma:migrate (+5 more)

### Community 87 - "password.ts"
Cohesion: 0.20
Nodes (16): main(), extractText(), main(), refreshContentText(), constantTimeEqual(), fromBase64Url(), toBase64Url(), derive() (+8 more)

### Community 89 - "register"
Cohesion: 0.27
Nodes (12): loginAndCreatePage(), API, CSRF_HEADER, makeBlock(), makePage(), makeWorkspace(), register(), uniqueEmail() (+4 more)

### Community 93 - "uploads.ts"
Cohesion: 0.47
Nodes (5): appendAsset(), importFile(), PickedAsset, uploadImage(), AttachmentDTO

### Community 96 - "metro.config.js"
Cohesion: 0.25
Nodes (7): config, { getDefaultConfig }, { withNativeWind }, expo@~58.0.25, nativewind@^4.2.7, expo, nativewind

## Knowledge Gaps
- **5 isolated node(s):** `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json`, `Spec-Driven Development Pipeline`, `Verification Gate (lint/typecheck/test:e2e)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 495 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `@playwright/test` to `api/helpers.ts`, `devDependencies`, `frontend/package.json`, `databases.spec.ts`, `templates.spec.ts`, `register`, `sheets.spec.ts`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkspaceSwitcher.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11846689895470383 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `auth.service.ts` to `backend/package.json`, `markdown.ts`, `routes/workspaces.ts`, `backend/package.json`, `adopt.service.ts`, `export.service.ts`, `blocks.service.ts`, `routes/databases.ts`, `http/types.ts`, `pages.service.ts`, `import.ts`, `auth/permissions.service.ts`, `getPrisma`, `utils/errors.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `routes/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `WorkspaceSwitcher.tsx`, `FilterSortBar.tsx`, `api/client.ts`, `dependencies`, `ui.tsx`, `frontend/features/editor/Editor.tsx`, `frontend/stores/theme.ts`, `frontend/package.json`, `frontend/components/db/CellEditor.tsx`, `[pageId].tsx`, `uploads.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `backend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._