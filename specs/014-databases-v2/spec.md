# Spec: 014 — Databases v2 (Notion-style)

## 1. Summary
Brings the databases feature to parity with Notion's mental model: one data
source (a set of structured pages sharing a schema) viewed through many lenses
(views), where each row IS a page. Adds view types beyond Table (List, Board,
Gallery), per-view filters/sorts/grouping, full row/column lifecycle and
reordering, new property types (multi_select, status, system types), and the
relational power tools (Relation + Rollup).

## 2. Motivation / user stories
- As a user, I want multiple views of the same database (Table, List, Board,
  Gallery) so I can see my data in the way that fits the task.
- As a user, I want to filter and sort rows per view, non-destructively, so the
  underlying data is unchanged.
- As a user, I want to open a database row as a full page (with its own blocks)
  and edit its properties there, because rows are pages.
- As a user, I want to add/delete/reorder columns and rows.
- As a user, I want multi-select, status, and created/edited-time/by columns.
- As a user, I want to link rows across databases (Relation) and aggregate
  through those links (Rollup).

## 3. Scope
### In scope (delivered in 7 slices)
- **Schema**: `PropertyType` extended (multi_select, status, relation, rollup,
  created_time, created_by, last_edited_time, last_edited_by); new
  `DatabaseView` model + `ViewType` enum (table/list/board/gallery); `Property`
  gains `relation_database_id` + `rollup_config`; `Page` gains `row_order`.
- **Lifecycle & reorder**: delete column, move column (before/after anchors),
  delete row, reorder row.
- **Views**: CRUD for views; `getDatabase` applies a view's filters + sorts via
  `?view_id=`. Pure `applyViewConfig` helper, unit-tested.
- **View renderers**: Table (existing), List, Board (Kanban, group-by a
  select/status/multi_select, drag between columns), Gallery (card grid).
- **Row-as-page**: clicking a row navigates to its page; a property panel edits
  the row's cells; the row page title is bidirectionally synced with the "Name"
  text property.
- **New property types**: multi_select (colored chips, array value), status
  (grouped select), system types (read-only, derived from the row page),
  select options with colors (legacy `string[]` tolerated).
- **Relation**: link rows across databases in the same workspace; two-way sync
  (inverse property created lazily); relation cells resolve to `{page_id,title}`
  summaries.
- **Rollup**: aggregate (sum/avg/min/max/count/show_original) a target property
  through a relation; read-only.

### Out of scope (documented follow-ups)
- Inline database-as-block (databases remain page-level, rendered below editor).
- Sub-items / parent-item row recursion.
- Templates and automations.
- Linked (mirrored) databases on other pages.
- Calendar / Timeline views.
- CSV/XLSX import/export.
- Real-time collaborative cell editing; conditional formatting.
- Formula engine expansion (date math, regex, etc.).

## 4. Developer-facing behavior
- All routes require auth + CSRF on mutations; workspace membership checked via
  the database's hosting page.
- `getDatabase?view_id=` returns rows filtered + sorted per that view's config
  (filters AND'd; multi-key stable sort). Without `view_id`, full row set,
  unchanged behavior.
- Rows are ordered by `row_order asc, created_at asc`. New rows append
  (`max + 1`); row reorder re-packs to integers 1..n.
- System-type and rollup and formula cells are read-only → `SYSTEM_NOT_EDITABLE`
  / `FORMULA_NOT_EDITABLE` (400).
- Relation writes mirror into the inverse property (created lazily, named
  `<SourceDb> (from <RelProp>)`, marked `options.__inverse_of`).
- Rollup cells live in `row.computed[property_id]` (like formula cells).

## 5. Acceptance criteria (each testable 1:1 by e2e)
- [ ] Delete a column → gone; cannot delete the last property.
- [ ] Move a column via before_id → order reflects.
- [ ] Delete a row → gone from the database.
- [ ] Reorder a row via after_id → order reflects.
- [ ] A new database has one default Table view; create/delete views; cannot
      delete the last view.
- [ ] `?view_id=` filters rows (Status eq Done) and sorts (Price desc).
- [ ] View switcher renders Table → List → Gallery; Board groups by a select.
- [ ] Editing the Name cell updates the row page title; editing the title
      updates the Name cell; `database_id` is on the row PageDTO.
- [ ] Writing to a system/rollup property → 400 SYSTEM_NOT_EDITABLE.
- [ ] multi_select stores/returns an array; status stores a single value;
      created_time derives the row's timestamp.
- [ ] select options accept `{value,color}` (and legacy `string[]`).
- [ ] Relation links rows across databases with two-way inverse sync.
- [ ] Rollup `sum` aggregates a target property through a relation.
- [ ] Relation to another workspace → 400 RELATION_TARGET_INVALID.

## 6. Slices (implementation order)
1. Schema migration + shared types + contracts + backfill migration.
2. Row & column lifecycle + reorder (backend + e2e).
3. Views + filters + sorts (backend CRUD + applyViewConfig + frontend shell).
4. List / Board / Gallery renderers + group-by + UI tests.
5. Row-as-page (title↔Name sync + nav + property panel).
6. multi_select + status + system types.
7. Relation + Rollup (two-way sync, aggregation).
