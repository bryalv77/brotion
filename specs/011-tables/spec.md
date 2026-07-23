# Spec: 011 — Tables in the editor

## 1. Summary
Add editable tables to the TipTap block editor using `@tiptap/extension-table`.
Tables render as a `table` parent block + `table_row` child blocks (already in
the schema). The serializer converts between TipTap table nodes and the
table/table_row API shapes.

## 2. User stories
- As a user, I want to insert a table via the slash menu.
- As a user, I want to type into cells and have changes autosave.
- As a user, I want to add/remove rows and columns.

## 3. Scope
- TipTap Table + TableRow + TableCell + TableHeader extensions.
- Slash menu "Table" entry.
- Serializer: table ↔ table/table_row blocks (both directions).
- Autosave reconciliation for nested table rows.
- Editor CSS for table styling (borders, header, padding) — already added in 009.
- shared/block-schema.ts: `canHaveChildren` includes `"table"`.

## 4. Acceptance criteria
- [ ] Slash menu has a "Table" option.
- [ ] Inserting a table creates a 3×3 grid with a header row.
- [ ] Typing in a cell updates the content.
- [ ] Table renders with borders and header styling.

## 5. Dependencies: Tasks 0–8, Feature 1 (dark mode CSS).
