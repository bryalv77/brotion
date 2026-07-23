# Plan: 011 — Tables in the editor

## 1. TipTap table extensions
Install `@tiptap/extension-table`, `-table-row`, `-table-cell`, `-table-header`.
Register all four in `Editor.tsx`. The `Table` extension includes
`insertTable`, `addColumnAfter`, `deleteRow` etc. commands.

## 2. Slash menu
Add `{ label: "Table", icon: "⊞", action: "table", keywords: "table grid" }`.
Handler: `editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()`.

## 3. Serializer changes (`serializers.ts`)
- `blockToNode`: for a `table` block, build a TipTap `table` node from its
  `table_row` children. Each row → `tableRow` with cells mapped to
  `tableHeader` (first row if `has_header_row`) or `tableCell`.
- `nodeToBlocks`: for a ProseMirror `table` node, emit one `table` DocBlock +
  N `table_row` DocBlocks. The table block gets a synthetic id; rows reference
  it via `parent_block_id`.

## 4. Autosave (`useBlockSync.ts`)
Table is rendered as a single TipTap node but maps to multiple API blocks. On
update, diff the table node's rows against existing table_row blocks and
PATCH/create/delete individually with `parent_block_id`.

## 5. Shared schema
`canHaveChildren` → include `"table"`. Add `"table_row"` to `TEXT_BLOCK_TYPES`.

## 6. Backend: no changes (already supports table/table_row + nesting).

## No deviations.
