# Plan: 006 — Frontend: block editor (TipTap)

> Technical design derived from spec.md. Respects `specs/constitution.md` and
> `000-architecture/plan.md` §5.1 (TipTap decision).

## 1. Architecture overview

```
<PageView>
  <PageHeader>            (Task 7 — stub for now)
  <Editor>                (this task)
    <EditorContent/>      (TipTap rendered DOM)
    <SlashMenu/>           (popover on `/`)
  </Editor>
</PageView>
```

**Block ↔ TipTap mapping:** one `useEditor` per page. Each top-level node in
the ProseMirror doc = one block row. Node types map to `BlockType`:

| BlockType | TipTap node |
|-----------|-------------|
| paragraph | `paragraph` (built-in) |
| heading1/2/3 | `heading` with `level` attr |
| bulleted_list_item | `bulletList` > `listItem` |
| numbered_list_item | `orderedList` > `listItem` |
| todo | custom `todoItem` node with `checked` attr |
| quote | `blockquote` (built-in) |
| callout | custom `callout` node |
| code | `codeBlock` (built-in) |
| divider | `horizontalRule` (built-in) |

Inline marks: `bold`, `italic`, `underline`, `strike`, `code` (all built-in).

## 2. Folder structure (new files)

```
frontend/src/
├── features/editor/
│   ├── Editor.tsx              main editor component
│   ├── SlashMenu.tsx           slash command popover
│   ├── extensions/
│   │   ├── TodoItem.ts         custom todo node extension
│   │   └── Callout.ts          custom callout node extension
│   ├── serializers.ts          TipTap JSON ↔ block API shapes
│   ├── useAutosave.ts          debounced per-block save hook
│   └── editor.css              editor-specific Tailwind styles
├── api/blocks.ts               block CRUD API client
├── hooks/
│   ├── usePageBlocks.ts        RQ: fetch page + blocks
│   ├── useUpdateBlock.ts       RQ mutation: PATCH block
│   └── useCreateBlock.ts       RQ mutation: POST new block
└── routes/
    └── PageView.tsx            replaces PageViewStub
```

## 3. Data model
Consumes `BlockDTO` from `/shared`. `serializers.ts` converts between TipTap's
JSON node format and the `BlockContent` shapes in `block-schema.ts`.

## 4. Components (detailed)

### Editor
- Initializes `useEditor` with `StarterKit` + custom extensions.
- On mount, loads blocks from the API and sets the initial doc.
- `onUpdate` → debounce 1s → serialize the changed node → `PATCH /blocks/:id`.
- `onTransaction` (Enter key) → if a new node was created → `POST /pages/:id/blocks`.

### SlashMenu
- Listens for `/` typed at the start of an empty block.
- Renders a filterable dropdown of block types.
- On select → calls `editor.chain().focus().setNode(...)` to convert.

### useAutosave
- Tracks the last-known JSON per block.
- Debounces updates; on fire, diffs the doc and PATCHes changed blocks.
- Shows a "Saving…" / "Saved" indicator.

## 5. Libraries
| Concern | Choice | Why |
|--------|--------|-----|
| Editor core | `@tiptap/react` + `@tiptap/starter-kit` | Task 0 ADR 0001 |
| Extensions | `@tiptap/extension-*` (heading, underline, codeblock, etc.) | Official, tree-shakeable |

All within constitution. No deviation.

## 6. Edge cases
- **Empty page:** editor renders a single empty paragraph block.
- **Autosave race:** debounce ensures only one PATCH per block per idle period.
- **New block ID reconciliation:** provisional node gets the real ID from the
  POST response; if the POST fails, the node is removed + toast shown.
- **Block deletion (Backspace at start of empty):** the node is removed from the
  doc; a DELETE /blocks/:id fires.
- **List nesting:** TipTap handles nesting natively; each listItem maps to a
  block row with `parent_block_id`.

## 7. Non-functional
- Debounced autosave (1s) minimizes API calls.
- Editor CSS uses Tailwind classes via `editor.css` ProseMirror selectors.
- Keyboard shortcuts match Notion/standard expectations.

## 8. Deviations
None.

## 9. Resolution of open questions
- **One editor per page** (not per-block).
- **Per-block autosave** (diff + PATCH changed nodes).
- **Backend generates block IDs** (POST returns the row).
