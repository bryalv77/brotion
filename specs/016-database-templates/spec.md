# Spec: 016 — Database Templates

## 1. Summary
A Template is a reusable factory attached to a Database that pre-fills new rows
(pages) with a block body and default property values. When a user creates a row
from a template, the template's blocks are deep-copied onto the new row and its
defaults are seeded; the new row is then fully independent of the template
(factory / prototype semantics — no later synchronization). A database may mark
one template as the default, which is auto-applied on "New row" Notion-style.

## 2. Motivation / user stories
- As a user, I want to define a template on a database so that new rows start
  with a standard structure (headings, checklists, callouts, …).
- As a user, I want a template to set default property values (Status=Todo,
  Priority=High, …) so I don't re-type them each time.
- As a user, I want one template to be the default, so "New row" just works
  with my preferred starting point.
- As a user, I want to choose a non-default template manually when I create a
  row.
- As a user, I want edits to a row created from a template to NEVER change the
  template, and edits to the template to NEVER change existing rows.
- As a user, I must never see a template's hidden body page in the sidebar,
  search results, or breadcrumbs — it is internal to the template.

## 3. Scope
### In scope
- `Template` Prisma model + `is_template` flag on `Page`; migration
  `20260802020000_templates`.
- Template CRUD: create / list / get / update (name, icon, is_default,
  default_values) / delete (OWNER).
- The template body is a hidden Page (`is_template=true`) edited through the
  existing block endpoints (`/pages/:pageId/blocks`).
- Row creation with a template: `POST /databases/:id/rows` accepts
  `{ template_id? }`; the template's blocks are deep-copied and
  `default_values` seeded. Omitted + a default template → auto-applied.
- `default_values` accepts every editable property type (formula/rollup and the
  four system types are rejected server-side, mirroring `updatePropertyValue`).
- Hidden-page exclusion from sidebar tree (+ child counts), search, breadcrumbs,
  and trash.
- Frontend: "+ New row" becomes a dropdown (empty / templates) when templates
  exist; a "Templates" button opens a management modal (create, rename, set
  default, delete, edit content).

### Out of scope (documented follow-ups)
- Dynamic variables (`{{today}}`, `{{created_by}}`, …) resolved at
  instantiation — explicitly deferred.
- Automations / triggered actions on row creation.
- Synced blocks (a row is independent from its template after creation by
  design).
- Template inheritance (templates are independent; no parent template).
- Linked / mirrored databases inside a template body.

## 4. Developer-facing behavior
- All template routes require auth + CSRF on mutations; access is resolved via
  the database's hosting page (EDITOR to write, VIEWER to read, OWNER to
  delete).
- `createTemplate` builds a hidden body page (`is_template=true`,
  `parent_id=null`) inside a transaction and links it. The first template on a
  database becomes the default.
- `default_values` is a `{ property_id: value }` map; non-editable types are
  rejected with `NON_DEFAULTABLE_TYPE` / unknown properties with
  `UNKNOWN_PROPERTY`.
- `addRow` resolves the effective template: explicit `template_id` → that one
  (must belong to the db, else `TEMPLATE_WRONG_DATABASE` / `TEMPLATE_NOT_FOUND`);
  no explicit id + a default exists → the default; otherwise an empty row
  (legacy behavior, return shape unchanged: `{ page_id, title }`).
- Block deep-copy reuses the `idMap` remap pattern from `duplicatePage`,
  factored into `cloneBlocks(tx, srcPageId, dstPageId, userId)`.
- The "Name" text default drives the new row's `title` (mirrors the
  title↔Name sync in `updatePropertyValue`).
- Hidden pages are excluded by `is_template: false` in `listChildPages` (rows +
  child counts), the search SQL, `getPageAncestors`, and `listTrashedPages`.
  `getDatabase` rows are unaffected (the hidden page has `database_id=null`).

## 5. Acceptance criteria (each testable 1:1 by e2e)
- [ ] Create a template → it appears in the database's `templates` list and is
      the default (first template).
- [ ] Add a block to the template body → persists; the block is retrievable.
- [ ] Create a row with no template (and no default) → empty row (regression).
- [ ] Create a row from a template → the template's blocks are copied onto the
      row; default values are seeded on the row's cells.
- [ ] A default template is auto-applied when "New row" omits a template id.
- [ ] Editing the instantiated row does NOT modify the template (independence).
- [ ] Editing the template does NOT modify rows already created (independence).
- [ ] The template's hidden body page does not appear in the sidebar, search, or
      breadcrumbs.
- [ ] Deleting a template (OWNER) succeeds and does not affect already-created
      rows.
- [ ] A VIEWER cannot create/edit a template (403); a non-OWNER cannot delete.

## 6. Dependencies
- Depends on specs: 003 (pages/blocks), 012 (databases), 014 (databases v2 —
  row-as-page, property types).
- Depended on by: none yet.

## 7. Open questions
- None remaining (resolved during planning: storage = hidden page; ocultamiento
  = `is_template` flag; defaults = all editable types; UX = dropdown new row).
