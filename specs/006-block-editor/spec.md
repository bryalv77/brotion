# Spec: 006 — Frontend: block editor (TipTap)

## 1. Summary
Replace the page view stub with a Notion-style block editor built on TipTap.
Supports paragraph, headings, lists, to-do, quote, callout, code, and divider
blocks; slash command menu; inline formatting (bold/italic/underline/strike/
code); and autosave (debounced PATCH to the backend).

## 2. Motivation / user stories
- As a user, I want to click into a page and start writing blocks immediately.
- As a user, I want to type `/` to open a slash menu and pick a block type.
- As a user, I want to format inline text (bold, italic, etc.) via keyboard
  shortcuts (Cmd+B, etc.).
- As a user, I want my changes to save automatically without a save button.
- As a user, I want to press Enter to create a new block and Backspace at the
  start of an empty block to merge/delete.
- As a user, I want headings, lists, to-dos, quotes, code, and dividers.

## 3. Scope
### In scope
- TipTap editor with custom node extensions for each block type.
- Slash command menu (`/` trigger → filterable list → insert block).
- Inline marks: bold, italic, underline, strike, code.
- Block types: paragraph, h1, h2, h3, bulleted list, numbered list, to-do,
  quote, callout, code, divider.
- Autosave: debounced (1s) sync of the document JSON to `PATCH /blocks/:id`
  and `POST /pages/:id/blocks` for new blocks.
- Keyboard: Enter (new block), Backspace-at-start (merge/delete), arrow keys.
- Replace `PageViewStub` with `PageView` containing the editor.

### Out of scope
- Drag-and-drop block reordering (deferred to a refinement).
- Image/table blocks in the editor (the API supports them; editor UI is later).
- Real-time collaboration (Task 4 deferred socket.io).
- Floating selection toolbar (format-on-select popup).

## 4. User-facing behavior
- Clicking a page loads the editor with existing blocks rendered.
- Typing updates the block content; after 1s of no typing, the change is saved.
- `/` at the start of an empty block (or after a space) opens the slash menu.
- Selecting a block type from the menu converts the current block.
- Cmd+B/I/U and `Cmd+E` (code) toggle inline marks.
- Enter creates a new paragraph block below; the backend creates the row.
- A loading indicator shows while saving; errors surface as a toast.

## 5. Dependencies
- Depends on: `000-architecture` (TipTap decision, block schema), Tasks 1–5
  (backend API + app shell).
- Depended on by: Task 7 (page header/cover/icon wraps around the editor).

## 6. Acceptance criteria
- [ ] Page view renders an editable block editor (not the stub).
- [ ] Existing blocks load and display their text.
- [ ] Typing in a paragraph block updates content and autosaves (PATCH observed).
- [ ] `/` opens a slash menu with block type options.
- [ ] Selecting "Heading 1" from the menu converts the block to an h1.
- [ ] Cmd+B toggles bold on selected text.
- [ ] Pressing Enter at the end of a block creates a new paragraph below.
- [ ] To-do block renders a checkbox; clicking toggles `checked`.
- [ ] Code block renders with monospace styling.

## 7. Open questions
- Block ↔ TipTap node mapping: one TipTap doc or per-block editors? → plan:
  **one TipTap editor per page**, where each top-level node maps to a block row.
  This gives natural cursor movement between blocks while letting us serialize
  node-by-node to the API.
- Autosave granularity: per-block or per-document? → plan: per-block — on
  content change, debounce then PATCH the affected block.
- New block creation: who generates the ID? → plan: the backend (POST
  /pages/:id/blocks returns the block with its ID). The editor inserts a
  provisional node, then reconciles when the response arrives.
