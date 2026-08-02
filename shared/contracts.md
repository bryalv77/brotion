# API Contracts — Notion Clone

> **Single source of truth for every endpoint.** Both `frontend` and `backend`
> must match the shapes defined here and in `api-types.ts`. If anything in a
> task's `plan.md` diverges, **this file wins** (update the plan, not this file).
>
> Base URL: `/api/v1`. All responses use the envelope:
> ```json
> { "data": { ... } }                                            // success
> { "error": { "code": "...", "message": "...", "details": {} } } // failure
> ```
> Mutating endpoints require a valid session cookie (JWT access token) and send
> header `X-Requested-With: XMLHttpRequest` (CSRF mitigation alongside SameSite=Lax).

## Error codes (used throughout)
| Code | Meaning |
|------|---------|
| 400 | Validation error (malformed body / params) |
| 401 | Not authenticated / token invalid |
| 403 | Authenticated but not permitted |
| 404 | Resource not found (or hidden due to no access) |
| 409 | Conflict (e.g. email already registered) |
| 413 | Upload too large |
| 415 | Unsupported media type |
| 422 | Semantically invalid (e.g. reorder cycle) |
| 500 | Server error (returns an `errorId`, no stack) |

## Shared DTOs
```ts
UserDTO            = { id, email, name, avatar_url }
WorkspaceDTO       = { id, name, icon, role }              // role = caller's role
PageSummaryDTO     = { id, title, icon, parent_id, has_children }
PageDTO            = PageSummaryDTO & {
                       workspace_id, cover_url, is_deleted,
                       created_by, created_at, updated_at
                     }
BlockDTO           = { id, page_id, parent_block_id, type, content, order,
                      created_at, updated_at }
AttachmentDTO      = { id, url, mime_type, size_bytes }
PermissionDTO      = { id, page_id, user_id?, share_type, access, inherit, token? }
CommentDTO         = { id, block_id, page_id, user: UserDTO, body, resolved,
                      created_at, updated_at }
SearchResultDTO    = { page_id, title, snippet, rank }
```

## Auth — Task 2
### POST /auth/register
- Body: `{ email, password, name? }`
- 201: `{ data: { user: UserDTO } }` (sets httpOnly cookie pair)
- 400: invalid email / password too short
- 409: email already registered

### POST /auth/login
- Body: `{ email, password }`
- 200: `{ data: { user: UserDTO } }` (sets httpOnly cookies)
- 401: invalid credentials

### POST /auth/logout
- 204: no content (revokes session, clears cookies)

### POST /auth/refresh
- 200: `{ data: { user: UserDTO } }` (rotates access token cookie)
- 401: refresh token invalid/revoked/expired

### GET /me
- 200: `{ data: { user: UserDTO } }`
- 401: not authenticated

## Workspaces — Task 3
### GET /workspaces
- 200: `{ data: { workspaces: WorkspaceDTO[] } }` (user's memberships)

### POST /workspaces
- Body: `{ name, icon? }`
- 201: `{ data: { workspace: WorkspaceDTO } }` (creator = OWNER)
- 400: missing name

### GET /workspaces/:workspaceId
- 200: `{ data: { workspace: WorkspaceDTO } }`
- 403: not a member
- 404: not found

## Pages — Task 3
### GET /workspaces/:workspaceId/pages
- Query: `?parent_id=&include_deleted=false`
- 200: `{ data: { pages: PageSummaryDTO[] } }` (children of parent_id, or roots)
- 403: not a member

### POST /workspaces/:workspaceId/pages
- Body: `{ parent_id?, title?, icon?, cover_url? }`
- 201: `{ data: { page: PageDTO } }`

### GET /pages/:pageId
- 200: `{ data: { page: PageDTO, blocks: BlockDTO[] } }` (blocks ordered by `order`)
- 403: no permission
- 404: not found

### PATCH /pages/:pageId
- Body: `{ title?, icon?, cover_url? }` (partial)
- 200: `{ data: { page: PageDTO } }`

### DELETE /pages/:pageId
- Query: `?permanent=false` (default) | `true`
- 204: no content
- 403: permanent delete requires OWNER

### POST /pages/:pageId/restore
- 200: `{ data: { page: PageDTO } }`

### POST /pages/:pageId/duplicate
- 200: `{ data: { page: PageDTO } }` (deep-copy page + blocks)

### POST /pages/:pageId/move
- Body: `{ new_parent_id }` (`null` moves the page to the workspace root)
- 200: `{ data: { page: PageDTO } }` (parent_id updated; all descendants move with it)
- 403: requires EDITOR access on the moved page
- 422: would create a cycle, self-parent, cross-workspace target, or deleted parent
  (error `details.code` is one of `CYCLE` / `CROSS_WORKSPACE` / `PARENT_DELETED`)

### GET /pages/:pageId/ancestors
- 200: `{ data: { breadcrumbs: PageSummaryDTO[] } }` (ancestor chain, root→leaf, excludes self)
- 403: no permission

## Blocks — Task 3 (core)
### POST /pages/:pageId/blocks
- Body: `{ type, content, parent_block_id?, order?, before_id?, after_id? }`
  (server computes `order` from `before_id`/`after_id` midpoints if omitted)
- 201: `{ data: { block: BlockDTO } }`

### GET /pages/:pageId/blocks
- 200: `{ data: { blocks: BlockDTO[] } }`

### PATCH /blocks/:blockId
- Body: `{ content?, type? }` (autosave)
- 200: `{ data: { block: BlockDTO } }`

### DELETE /blocks/:blockId
- 204: no content (cascades children)

### POST /pages/:pageId/blocks/reorder
- Body: `{ block_id, before_id?, after_id?, new_parent_block_id? }`
- 200: `{ data: { block: BlockDTO } }`
- 422: would create a cycle

## Search — Task 3
### GET /workspaces/:workspaceId/search
- Query: `?q=&limit=20`
- 200: `{ data: { results: SearchResultDTO[] } }` (tsvector over titles+content)
- 400: empty query

## Files / attachments — Task 3
### POST /files
- Body: multipart/form-data `{ file, page_id?, block_id? }`
- Validates: type ∈ allowlist, size ≤ MAX_UPLOAD_BYTES
- 201: `{ data: { attachment: AttachmentDTO } }`
- 413: too large
- 415: unsupported type

### GET /files/:key
- 200: file bytes (serves stored file; v1 public read)

## Permissions / sharing — Task 4
### GET /pages/:pageId/permissions
- 200: `{ data: { permissions: PermissionDTO[] } }`

### POST /pages/:pageId/permissions
- Body: `{ user_id? | share_type: "PUBLIC_LINK", access, inherit? }`
- 201: `{ data: { permission: PermissionDTO } }`

### DELETE /pages/:pageId/permissions/:permissionId
- 204: no content

### GET /shared/:token
- 200: `{ data: { page: PageDTO, blocks: BlockDTO[] } }` (read-only shape)
- 404: invalid/expired token

## Comments — Task 4 (optional)
### GET /pages/:pageId/comments
- 200: `{ data: { comments: CommentDTO[] } }`

### POST /pages/:pageId/comments
- Body: `{ block_id, body }`
- 201: `{ data: { comment: CommentDTO } }`

### PATCH /comments/:commentId
- Body: `{ body?, resolved? }`
- 200: `{ data: { comment: CommentDTO } }`

### DELETE /comments/:commentId
- 204: no content

## Real-time — Task 4 (optional, socket.io)
- Room: `/pages/:pageId`. Auth via session cookie on handshake.
- Server→client: `block:updated`, `block:created`, `block:deleted`, `presence:update`.
- Client→server: `block:typing`.
- If not implemented, ship single-user and note the gap in the task report.

## Databases (Tasks 012/013 + v2)
A database is a set of structured pages (rows) sharing a schema (properties), each
row being a full page. `DatabaseDTO` carries `properties`, `views`, and `rows`
(with computed formula/rollup cells). Property types: text, number, select,
multi_select, status, date, checkbox, url, formula, relation, rollup,
created_time, created_by, last_edited_time, last_edited_by.

### GET /pages/:pageId/databases
- 200: `{ data: { databases: DatabaseDTO[] } }` (metadata only: properties + views, no rows)

### POST /pages/:pageId/databases
- Body: `{ title?, icon? }`
- 201: `{ data: { database: DatabaseDTO } }` (creates a default "Name" text column + a default Table view)

### GET /databases/:databaseId
- Query: `?view_id=` (when set, rows are filtered/sorted/hidden per that view's config)
- 200: `{ data: { database: DatabaseDTO } }` (rows ordered by `row_order`, formula/rollup cells computed)
- 403: no permission

### PATCH /databases/:databaseId
- Body: `{ title?, icon? }`
- 200: `{ data: { database: DatabaseDTO } }`

### DELETE /databases/:databaseId
- 204: no content (OWNER only; properties/values/views cascade; rows have database_id cleared)

### POST /databases/:databaseId/properties
- Body: `{ name, type, options?, relation_database_id?, rollup_config? }`
  - formula: `options: { formula }` (cycle-checked at write time)
  - select/multi_select/status: `options: { options: SelectOption[] }`
  - relation: `relation_database_id` (target db, same workspace)
  - rollup: `rollup_config: { relation_property_id, target_property_id, aggregation }`
- 201: `{ data: { property: PropertyDTO } }`
- 400: `FORMULA_CYCLE` if the formula would create a circular dependency

### PATCH /databases/:databaseId/properties/:propertyId
- Body: `{ name?, options?, rollup_config? }`
- 200: `{ data: { property: PropertyDTO } }`

### DELETE /databases/:databaseId/properties/:propertyId
- 204: no content (cascades the property's values; rejects if it's the last property)

### POST /databases/:databaseId/properties/:propertyId/move
- Body: `{ before_id?, after_id? }` (anchors among siblings; re-packs order 0..n)
- 200: `{ data: { properties: PropertyDTO[] } }` (full reordered set)

### POST /databases/:databaseId/rows
- 201: `{ data: { row: { page_id, title } } }` (creates a row Page; row_order = max+1)

### DELETE /rows/:rowPageId
- 204: no content (soft-deletes the backing page)

### POST /databases/:databaseId/rows/:rowPageId/move
- Body: `{ before_id?, after_id? }` (fractional-index reorder of rows)
- 200: no content

### PATCH /rows/:rowPageId/properties/:propertyId
- Body: `{ value }` (type-appropriate scalar/array)
- 200: `{ data: { value, computed } }` (re-evaluated formula cells for the row)
- 400: `FORMULA_NOT_EDITABLE` / `SYSTEM_NOT_EDITABLE`

### Views
#### POST /databases/:databaseId/views
- Body: `{ name?, type?, config? }` (defaults: name "Table", type "table", config {})
- 201: `{ data: { view: DatabaseViewDTO } }`

#### PATCH /databases/:databaseId/views/:viewId
- Body: `{ name?, type?, config? }`
- 200: `{ data: { view: DatabaseViewDTO } }`

#### DELETE /databases/:databaseId/views/:viewId
- 204: no content (rejects if it's the last view)

#### POST /databases/:databaseId/views/:viewId/move
- Body: `{ before_id?, after_id? }`
- 200: no content

### Templates
Templates are factories for new rows: applying one deep-copies its block body
(onto a freshly created row page) + seeds its `default_values`. After creation
the row is fully independent — editing the row never touches the template, and
editing the template never touches existing rows. No synchronization.

The template's body lives on a hidden page (`is_template=true` on the server),
edited through the normal block endpoints (`/blocks`, by `page_id`).

#### GET /databases/:databaseId/templates
- 200: `{ data: { templates: TemplateDTO[] } }`

#### POST /databases/:databaseId/templates
- Body: `{ name?, icon? }`
- 201: `{ data: { template: TemplateDTO } }` (creates a hidden body page; first
  template on a database becomes the default)

#### GET /databases/:databaseId/templates/:templateId
- 200: `{ data: { template: TemplateDTO } }`

#### PATCH /databases/:databaseId/templates/:templateId
- Body: `{ name?, icon?, is_default?, default_values? }`
  - `is_default: true` un-marks other templates on the same database (only one
    default at a time).
  - `default_values`: `{ property_id: value }`; server rejects non-editable
    types (formula/rollup/created_*/last_edited_*).
- 200: `{ data: { template: TemplateDTO } }`

#### DELETE /databases/:databaseId/templates/:templateId
- 204: no content (OWNER only; cascades the hidden body page + its blocks)

#### Row creation with a template
`POST /databases/:databaseId/rows` now accepts `{ template_id?: string | null }`.
- Omitted/null + no default template → empty row (legacy behavior).
- Explicit `template_id` → that template's body + defaults are applied.
- Omitted/null + the database has a default template → the default is applied
  automatically (Notion-style).

Editing a template's body uses the standard block endpoints against the
template's hidden `page_id`:
- `POST /blocks` (create), `PATCH /blocks/:id`, `DELETE /blocks/:id`,
  `POST /blocks/reorder` — all gated on EDITOR access via the template's
  database → hosting page.
