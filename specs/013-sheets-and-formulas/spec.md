# Spec: 013 — Sheets & Formulas (Notion-style database formulas)

## 1. Summary

A page can host an inline **sheet** (the existing Notion-style database from
spec 012, here called a "sheet" in the UI). Each sheet has typed columns. A
column can be of a new `formula` type whose value is a small expression language
that can read other columns on the **same row** and compute a result. When any
input cell changes, dependent formula cells on the same row are recomputed
automatically by the backend.

## 2. Motivation / user stories

- As a user, I want to add a sheet to any page (next to the block editor), so I
  can track structured data in Notion's "inline database" style.
- As a user, I want to add a `formula` column whose value is computed from
  other columns of the same row, so I can compute totals, concatenate names,
  branch on conditions, etc. — without writing code.
- As a user, I want the formula result to update automatically when I edit any
  input column, so the sheet stays consistent.
- As a user, I want to see a clear error message in a formula cell when the
  expression is invalid (parse error, missing dependency, divide-by-zero, type
  mismatch, etc.), so I can fix it.
- As a user, I want to type a formula and see a live preview before committing,
  so I can iterate without spamming saves.

## 3. Scope

### In scope
- Adding a `formula` value to the `PropertyType` enum (Prisma migration).
- Storing formulas as `PropertyValue.value = { formula: "<expr>" }`; the
  **stored** value of a formula property is the source text. The
  **computed** value is derived on read and on demand.
- A small expression language with:
  - Literals: numbers, strings (double-quoted), booleans (`true`/`false`).
  - Property references: `prop("Price")`, `prop("Name")` (Notion-style;
    references other properties on the **same row**).
  - Arithmetic: `+ - * / %`, unary `-`.
  - Comparisons: `== != < <= > >=`.
  - Logical: `and`, `or`, `not` (lowercase, Notion-style).
  - String concat via `+` (e.g. `prop("First") + " " + prop("Last")`).
  - Parentheses.
  - Functions: `if(cond, then, else)`, `concat(...)`, `contains(haystack, needle)`,
    `length(s)`, `upper(s)`, `lower(s)`, `trim(s)`, `round(n, [digits])`,
    `abs(n)`, `min(...)`, `max(...)`, `sum(...)`, `avg(...)`, `count(...)`,
    `now()`.
  - Implicit type coercion for arithmetic and comparisons (numeric strings
    become numbers; empty/null is 0 in numeric context; null compares equal
    to null).
- Server-side evaluation:
  - On every `updatePropertyValue`, re-evaluate the affected row's formula
    cells; cache the result in an in-process LRU keyed by `(property_id,
    page_id)` so the next `getDatabase` returns it without re-parsing.
  - When a property is renamed or its type changes, re-evaluate every formula
    cell on the database.
  - Cycle detection: if formula A depends on formula B and B depends on A,
    both cells return `{ error: "circular" }` (no infinite recursion).
- Frontend:
  - The `DatabaseView` component (currently orphaned) is wired into
    `PageView` below the block editor, once per page.
  - A new slash-menu item `/database` (and a button) creates a sheet on the
    current page; the sheet appears immediately.
  - Formula cells render in read mode as the **computed result**; clicking
    opens a formula bar that shows the source and lets the user edit; the
    bar offers a live preview of the result against the current row's other
    values.
  - If the formula has an error, the cell shows the error in a tooltip and
    in muted red.
  - The same component handles the other 6 cell types as before (text,
    number, select, date, checkbox, url).

### Out of scope (deferred to a later task)
- XLSX import / export of sheets (the `xlsx` library is already a backend dep
  but is not wired up here).
- Sort, filter, group, search within a sheet.
- Cross-row references (`prop("Total")[0]`), aggregations across rows other
  than `sum/avg/min/max/count` over a column.
- Column resize, row reorder, drag-fill, conditional formatting.
- `select` column options (colors, multi-select).
- Real-time multi-user editing of cells (socket.io; spec 004's optional).

## 4. User-facing behavior

1. On any page, the user can:
   - Type `/database` in the editor → a sheet is created on the current page
     and rendered below the editor.
   - Or click an "Add a sheet" placeholder below the editor.
2. The new sheet has a default `Name` text column and one empty row.
3. The user can:
   - Click `+` in the header row to add a new column. The type dropdown
     includes `Formula` as an option.
   - Choose `Formula`, give it a name, type the expression. On commit the
     column appears and every existing row shows the computed result.
4. Editing a formula cell opens a small popover with:
   - A text input bound to the formula source.
   - A live preview "→ 42" line that re-evaluates against the current row's
     other values as the user types.
   - A "Done" / `Esc` to commit; `Enter` to commit if non-empty.
5. Editing any input cell in a row triggers a server recompute of all
   formula cells in that row; the next render shows the new result.
6. Errors:
   - Parse error → cell shows `⚠ Parse error: <message>` in muted red;
     formula bar still shows the source.
   - Type error (e.g. `prop("X") + 5` where `X` is a checkbox) → cell shows
     `⚠ Type error: ...`.
   - Circular dependency → cell shows `⚠ Circular`.
   - Missing property (`prop("Foo")` where `Foo` doesn't exist) → cell shows
     `⚠ Unknown property: Foo`.
7. Permissions: same as other database operations. Viewers see computed
   values; editors can edit any non-formula cell; only editors can edit
   formula cells (since they affect every row).

## 5. Dependencies
- Depends on: spec 012 (databases), spec 003 (pages, blocks), spec 002 (auth).
- Depended on by: future spec for sort/filter, future XLSX I/O.

## 6. Acceptance criteria (must be testable 1:1 by e2e tests)

- [ ] A. User creates a sheet on a page via API; `GET /databases/:id` returns
      a `DatabaseDTO` with the new property in `properties` and one row in
      `rows`.
- [ ] B. User adds a `formula` column with `prop("Price") * prop("Qty")` and
      sets `Price = 10`, `Qty = 3` on a row; the formula cell's
      `computed.value === 30`.
- [ ] C. Updating `Price` to `20` causes the formula cell to re-evaluate to
      `60` (verified by re-fetching the database).
- [ ] D. A formula referencing an unknown property `prop("Nope")` returns a
      per-cell error `{ error: "unknown_property", message: "Nope" }` and
      the HTTP response is still `200` (the error is per-cell, not at the
      request level).
- [ ] E. A formula with a parse error (`1 +`) returns a per-cell error
      `{ error: "parse" }`.
- [ ] F. Two formula cells that depend on each other both return
      `{ error: "circular" }` (no infinite loop, no 500).
- [ ] G. Renaming a property referenced by a formula (`Price` → `Cost`)
      causes the formula source to be unchanged but the next evaluation
      returns `{ error: "unknown_property", message: "Price" }` — the user
      must update the formula. (No automatic rewrite.)
- [ ] H. The frontend `DatabaseView` renders on `PageView` below the editor
      after a sheet is created; it shows the computed result, not the
      formula source.
- [ ] I. The slash menu includes a `Database` / `Sheet` action that creates
      a sheet and the new sheet appears without a hard refresh.
