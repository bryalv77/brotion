# Graph Report - notion-clone  (2026-11-17)

## Corpus Check
- 249 files · ~87,526 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 34 file(s) not represented in the graph (top: .sqlite 7, .sqlite-shm 7, .sqlite-wal 7)

## Summary
- 1534 nodes · 4057 edges · 78 communities (62 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.85)
- Token cost: 0 input · 297,143 output

## Graph Freshness
- Built from commit: `70043fff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.service.ts
- databases.service.ts
- routes/auth.ts
- backend/package.json
- PageTree.tsx
- [pageId].tsx
- scripts
- app.ts
- getPrisma
- dependencies
- api-types.ts
- devDependencies
- engine.ts
- zod
- blocks.service.ts
- routes/databases.ts
- http/types.ts
- compilerOptions
- compilerOptions
- routes/pages.ts
- registry/types.ts
- DatabaseView.tsx
- mode.ts
- shared/package.json
- server.ts
- request
- getAccessiblePage
- compilerOptions
- docx.ts
- compilerOptions
- middleware.ts
- utils/errors.ts
- routes/blocks.ts
- frontend/package.json
- api/client.ts
- frontend/components/WorkspaceSwitcher.tsx
- markdown.ts
- api/me.ts
- BlockRow.tsx
- ui.tsx
- tailwindcss
- frontend/features/editor/Editor.tsx
- prepare-pages.js
- Notion Clone Root README
- expo-file-system@*
- export.service.ts
- routes/workspaces.ts
- react-native-reanimated@*
- lib/session.ts
- frontend/components/db/CellEditor.tsx
- LocalStore
- WorkspaceSwitcher.tsx
- expo-sqlite
- local/databases.ts
- scripts
- react-native-safe-area-context@*
- @paralleldrive/cuid2
- react-native-web@0.21.4
- react-native-screens@*
- react-native-worklets@0.13.0
- expo
- dependencies
- release-ios.mjs
- frontend/stores/theme.ts
- adopt.service.ts
- secureStore.web.ts
- misc.ts
- scripts
- auth.service.ts
- AGENTS.md
- api/helpers.ts
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
- `PendingUpdate` --references--> `BlockType`  [EXTRACTED]
  frontend/features/editor/Editor.tsx → shared/api-types.ts
- `AssembledRow` --references--> `ComputedCell`  [EXTRACTED]
  frontend/lib/data/local/databases.ts → shared/api-types.ts

## Import Cycles
- 2-file cycle: `shared/applyViewConfig.ts -> shared/index.ts -> shared/applyViewConfig.ts`

## Communities (78 total, 16 thin omitted)

### Community 0 - "pages.service.ts"
Cohesion: 0.24
Nodes (16): assertWorkspaceMember(), importFile(), SUPPORTED_EXTENSIONS, toPageDTO(), toPageSummaryDTO(), collectSubtreeIds(), createPage(), duplicatePage() (+8 more)

### Community 1 - "databases.service.ts"
Cohesion: 0.16
Nodes (20): addProperty(), addRow(), createView(), deleteDatabase(), deleteProperty(), deleteRow(), deleteView(), loadDbForEdit() (+12 more)

### Community 2 - "routes/auth.ts"
Cohesion: 0.15
Nodes (18): C, clearSessionCookies(), setSessionCookies(), authRoutes, isNative(), sessionBody(), LoginInput, loginSchema (+10 more)

### Community 3 - "backend/package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @cloudflare/workers-types@^5.20261116.1, pino-pretty@^11.3.0, prisma@^5.22.0, tsx@^4.19.2, @types/markdown-it@^14.1.2, @types/node@^22.9.0, typescript@^5.6.3 (+16 more)

### Community 4 - "PageTree.tsx"
Cohesion: 0.16
Nodes (17): TrashScreen(), PageTree(), PageTreeNode(), PageTreeProps, useChildPages(), useCreatePage(), useMovePage(), createPage (+9 more)

### Community 5 - "[pageId].tsx"
Cohesion: 0.24
Nodes (15): PageScreen(), PageAttachments(), PageDatabases(), Loading(), useCreateDatabase(), usePageBreadcrumbs(), usePageDatabases(), listAttachments (+7 more)

### Community 6 - "scripts"
Cohesion: 0.06
Nodes (38): devDependencies, concurrently@^8.2.2, eslint@^8.57.1, eslint-config-prettier@^9.1.0, prettier@^3.3.3, typescript@^5.6.3, @typescript-eslint/eslint-plugin@^7.18.0, @typescript-eslint/parser@^7.18.0 (+30 more)

### Community 7 - "app.ts"
Cohesion: 0.11
Nodes (18): createApp(), errorResponse(), databasesRoutes, pageDatabasesRoutes, rowsRoutes, exportRoutes, attachmentsRoutes, filesRoutes (+10 more)

### Community 8 - "getPrisma"
Cohesion: 0.34
Nodes (12): main(), toTemplateDTO(), createTemplate(), deleteTemplate(), getTemplate(), getTemplateBodyPageId(), listTemplates(), loadDbForEdit() (+4 more)

### Community 9 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, cheerio@^1.2.0, hono@^4.13.19, jose@^6.2.17, mammoth@^1.12.0, @neondatabase/serverless@0.10.4, @notion-clone/shared@0.1.0, pino@^9.5.0 (+11 more)

### Community 10 - "api-types.ts"
Cohesion: 0.06
Nodes (47): AdoptLocalDatabase, AdoptLocalValue, ApiSuccess, BreadcrumbsResponse, ComputedCellStatus, CreateBlockRequest, CreateCommentRequest, CreatePermissionRequest (+39 more)

### Community 11 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @playwright/test@^1.48.2, @types/node@^22.9.0, @types/react@^19.0.0, typescript@^5.6.3, @types/node, typescript, @types/react

### Community 12 - "engine.ts"
Cohesion: 0.05
Nodes (57): AstNode, Binary, BinaryOp, BoolLit, Call, NullLit, NumberLit, PropRef (+49 more)

### Community 13 - "zod"
Cohesion: 0.13
Nodes (11): zod@^3.23.8, AdoptLocalInput, adoptLocalSchema, isoString, InstantiatePageTemplateInput, instantiatePageTemplateSchema, CreatePermissionInput, createPermissionSchema (+3 more)

### Community 14 - "blocks.service.ts"
Cohesion: 0.24
Nodes (16): createBlock(), deleteBlock(), isDescendant(), listBlocks(), loadBlockInAccessiblePage(), reorderBlock(), resolveAnchors(), updateBlock() (+8 more)

### Community 15 - "routes/databases.ts"
Cohesion: 0.11
Nodes (26): toDatabaseDTO(), toDatabaseViewDTO(), CreateDatabaseInput, createDatabaseSchema, CreatePropertyInput, createPropertySchema, CreateRowInput, createRowSchema (+18 more)

### Community 16 - "http/types.ts"
Cohesion: 0.26
Nodes (8): LogFn, logger, LoggerLike, AppBindings, runWithPrisma(), Env, initWorkerEnv(), fetch()

### Community 17 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, lib, module, moduleResolution, noEmitOnError, outDir, rootDir (+6 more)

### Community 18 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, baseUrl, moduleResolution, noEmit, paths, strict, types (+4 more)

### Community 19 - "routes/pages.ts"
Cohesion: 0.24
Nodes (9): pagesRoutes, workspacePagesRoutes, workspaceTrashRoutes, CreatePageInput, createPageSchema, MovePageInput, movePageSchema, UpdatePageInput (+1 more)

### Community 20 - "registry/types.ts"
Cohesion: 0.05
Nodes (35): contentPlannerTemplate, crmTemplate, financeTrackerTemplate, habitTrackerTemplate, ALL_PAGE_TEMPLATES, knowledgeBaseTemplate, projectManagementTemplate, readingListTemplate (+27 more)

### Community 21 - "DatabaseView.tsx"
Cohesion: 0.13
Nodes (23): DatabaseView(), VIEWS, FILTER_OPS, FilterSortBar(), filterValueText(), TemplatesModal(), Chip(), Divider() (+15 more)

### Community 22 - "mode.ts"
Cohesion: 0.33
Nodes (4): isLocalMode(), route(), instantiatePageTemplate, listPageTemplates

### Community 23 - "shared/package.json"
Cohesion: 0.08
Nodes (27): import, types, import, types, devDependencies, tsx@^4.19.2, @types/node@^22.9.0, typescript@^5.6.3 (+19 more)

### Community 24 - "server.ts"
Cohesion: 0.11
Nodes (18): dotenv@^16.4.7, @hono/node-server@^2.1.9, env, Env, envSchema, parsed, diskBucket(), disconnectPrisma() (+10 more)

### Community 25 - "request"
Cohesion: 0.10
Nodes (33): createBlock(), deleteBlock(), updateBlock(), request(), addProperty(), addRow(), createDatabase(), createTemplate() (+25 more)

### Community 26 - "getAccessiblePage"
Cohesion: 0.24
Nodes (14): getAccessiblePage(), toCommentDTO(), createComment(), deleteComment(), listComments(), loadCommentInAccessiblePage(), updateComment(), getPageAncestors() (+6 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noFallthroughCasesInSwitch (+8 more)

### Community 28 - "docx.ts"
Cohesion: 0.13
Nodes (15): unpdf@^1.8.0, parseByFormat(), extFromMime(), extractInline(), htmlToBlocks(), runsFromElement(), parseDocx(), parseHtmlTable() (+7 more)

### Community 29 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declaration, declarationMap, module, moduleResolution, noEmit, outDir (+6 more)

### Community 30 - "middleware.ts"
Cohesion: 0.34
Nodes (11): C, created(), ok(), optionalJson(), csrfGuard, requireAuth, AppEnv, getCurrentUser() (+3 more)

### Community 31 - "utils/errors.ts"
Cohesion: 0.15
Nodes (13): toAttachmentDTO(), ALLOWED, extOf(), FileBucket, isValidStorageKey(), mimeForKey(), storeUpload(), UploadInput (+5 more)

### Community 32 - "routes/blocks.ts"
Cohesion: 0.13
Nodes (15): noContent(), blocksRoutes, pageBlocksRoutes, commentsRoutes, pageCommentsRoutes, CreateBlockInput, createBlockSchema, ReorderBlockInput (+7 more)

### Community 33 - "frontend/package.json"
Cohesion: 0.12
Nodes (16): expo-linking@*, expo-secure-store@*, expo-status-bar@*, @notion-clone/shared@0.1.0, react-native-gesture-handler@~3.3.0, react-native-svg@15.16.0, @notion-clone/shared, main (+8 more)

### Community 34 - "api/client.ts"
Cohesion: 0.10
Nodes (20): AuthResponse, getMe(), login(), logout(), register(), clearCredentials(), HOST, persistNativeTokens() (+12 more)

### Community 35 - "frontend/components/WorkspaceSwitcher.tsx"
Cohesion: 0.16
Nodes (16): AppLayout(), AppShell(), plainSnippet(), QuickSearch(), close(), select(), workspaceIdFromPath(), Sidebar() (+8 more)

### Community 36 - "markdown.ts"
Cohesion: 0.36
Nodes (7): markdown-it@^14.3.0, findInline(), inlineTokenToRichText(), md, parseMarkdown(), parseTableTokens(), markdown-it

### Community 37 - "api/me.ts"
Cohesion: 0.50
Nodes (3): adoptLocal(), AdoptLocalRequest, AdoptLocalResponse

### Community 38 - "BlockRow.tsx"
Cohesion: 0.29
Nodes (5): BlockRowProps, TEXT_STYLES, BlockConversion, colors, lucide-react-native

### Community 39 - "ui.tsx"
Cohesion: 0.25
Nodes (14): LoginScreen(), RegisterScreen(), ReconnectScreen(), Button(), ErrorBanner(), H1(), Input(), Muted() (+6 more)

### Community 41 - "frontend/features/editor/Editor.tsx"
Cohesion: 0.17
Nodes (19): BlockRow(), updateImage(), blockToText(), isRecord(), makeBlock(), richTextToPlainText(), textRun(), textToContent() (+11 more)

### Community 42 - "prepare-pages.js"
Cohesion: 0.22
Nodes (8): workbox-build@^7.4.1, copies, dist, fs, generateServiceWorker(), path, scriptsDir, workbox-build

### Community 43 - "Notion Clone Root README"
Cohesion: 0.67
Nodes (3): Notion Clone Root README, Spec-Driven Development Pipeline, Verification Gate (lint/typecheck/test:e2e)

### Community 45 - "export.service.ts"
Cohesion: 0.33
Nodes (8): pdf-lib@^1.17.1, blockPlainText(), blockToMarkdown(), richTextToMd(), sanitize(), toMarkdown(), toPdf(), pdf-lib

### Community 46 - "routes/workspaces.ts"
Cohesion: 0.14
Nodes (15): ACCESS_RANK, collectAncestorIds(), getAccessibleWorkspace(), resolveEffectiveAccess(), roleToAccess(), CommentWithUser, searchPages(), toUserDTO() (+7 more)

### Community 48 - "lib/session.ts"
Cohesion: 0.32
Nodes (8): RootLayout(), isUnauthorized(), adoptLocalData(), queryClient, enterGuest(), finishSignIn(), SessionMode, useSession

### Community 49 - "frontend/components/db/CellEditor.tsx"
Cohesion: 0.12
Nodes (39): toPropertyDTO(), toPropertyValueDTO(), toRowDTO(), ViewProps, BoardView(), CellEditor(), CellEditorProps, GalleryView() (+31 more)

### Community 50 - "LocalStore"
Cohesion: 0.06
Nodes (10): openIdbKV(), getLocalKV(), getLocalKV(), getLocalKV(), KV, openSqliteKV(), LocalSnapshot, LocalStore (+2 more)

### Community 51 - "WorkspaceSwitcher.tsx"
Cohesion: 0.22
Nodes (11): WorkspaceIndex(), WorkspaceView(), EmptyState(), ScrollScreen(), workspaceIdFromPath(), WorkspaceSwitcher(), handleCreate(), useWorkspaces() (+3 more)

### Community 53 - "local/databases.ts"
Cohesion: 0.07
Nodes (74): getDatabase(), loadAllValuesByName(), recomputeRowFormulas(), updateLanguage(), ApiClientError, createBlock(), deleteBlock(), updateBlock() (+66 more)

### Community 54 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android, build:web, dev, e2e:server:backend, e2e:server:frontend, ios, release:ios (+5 more)

### Community 62 - "expo"
Cohesion: 0.10
Nodes (19): edgeToEdge, package, typedRoutes, expo, android, experiments, ios, name (+11 more)

### Community 65 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-constants@*, expo-document-picker@*, expo-image-picker@*, @expo/metro-runtime@*, expo-router@~58.0.31, expo-sharing@*, idb@^8.0.4 (+13 more)

### Community 66 - "release-ios.mjs"
Cohesion: 0.07
Nodes (26): BG, chunk(), crc32(), CRC_TABLE, __dirname, draw(), encodePng(), FG (+18 more)

### Community 73 - "frontend/stores/theme.ts"
Cohesion: 0.17
Nodes (11): TemplatePrefsState, useTemplatePrefs, secureStore, sessionFlag, StoredTokens, tokenStorage, appStorage, ThemeMode (+3 more)

### Community 75 - "adopt.service.ts"
Cohesion: 0.21
Nodes (13): adoptLocalData(), AdoptResult, BLOCK_TYPES, date(), json(), PROPERTY_TYPES, VIEW_TYPES, createBlockTree() (+5 more)

### Community 85 - "misc.ts"
Cohesion: 0.19
Nodes (7): AttachmentInfo, listAttachments(), instantiatePageTemplate(), listPageTemplates(), instantiatePageTemplate(), PAGE_TEMPLATES, PageTemplateSummaryDTO

### Community 86 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:worker, dev, postinstall, prisma:deploy, prisma:generate, prisma:migrate (+5 more)

### Community 87 - "auth.service.ts"
Cohesion: 0.14
Nodes (27): extractText(), main(), refreshContentText(), IssuedSession, issueSession(), login(), logout(), refresh() (+19 more)

### Community 89 - "api/helpers.ts"
Cohesion: 0.07
Nodes (27): NOW, DbShape, loginAndCreatePage(), API, CSRF_HEADER, DEMO_EMAIL, DEMO_PASSWORD, HEADERS (+19 more)

### Community 93 - "uploads.ts"
Cohesion: 0.28
Nodes (8): appendAsset(), importFile(), PickedAsset, uploadImage(), AdoptLocalPage, AttachmentDTO, PageDTO, PageSummaryDTO

### Community 96 - "metro.config.js"
Cohesion: 0.25
Nodes (7): config, { getDefaultConfig }, { withNativeWind }, expo@~58.0.25, nativewind@^4.2.7, expo, nativewind

## Knowledge Gaps
- **5 isolated node(s):** `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json`, `Spec-Driven Development Pipeline`, `Verification Gate (lint/typecheck/test:e2e)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 427 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `api/helpers.ts` to `frontend/package.json`, `devDependencies`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `expo/tsconfig.base`, `../tsconfig.base.json` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `ui.tsx` to `frontend/package.json`, `api/client.ts`, `frontend/components/WorkspaceSwitcher.tsx`, `PageTree.tsx`, `[pageId].tsx`, `BlockRow.tsx`, `dependencies`, `frontend/features/editor/Editor.tsx`, `frontend/stores/theme.ts`, `lib/session.ts`, `frontend/components/db/CellEditor.tsx`, `WorkspaceSwitcher.tsx`, `DatabaseView.tsx`, `uploads.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `backend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `routes/workspaces.ts` to `pages.service.ts`, `backend/package.json`, `getPrisma`, `dependencies`, `adopt.service.ts`, `export.service.ts`, `blocks.service.ts`, `http/types.ts`, `frontend/components/db/CellEditor.tsx`, `auth.service.ts`, `getAccessiblePage`, `middleware.ts`, `utils/errors.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.06072874493927125 - nodes in this community are weakly interconnected._