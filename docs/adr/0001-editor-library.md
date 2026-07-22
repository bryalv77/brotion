# ADR 0001 — Block-editor library: TipTap

- **Status:** Accepted
- **Date:** 2026-07-22
- **Decider:** Architect (Task 0)
- **Supersedes:** none
- **Superseded by:** none

## Context

Task 6 requires a Notion-style block editor: each line is an independent block;
multiple block types (paragraph, headings, lists, to-do, quote, callout,
divider, code, image, table); slash command menu; floating selection menu;
drag handle reordering + nesting; autosave; rich keyboard shortcuts. The
editor is the most complex piece of the frontend, and its data model must map
cleanly to our `blocks` table (one row per block with a typed JSON `content`).

The constitution (`specs/constitution.md` §2) fixes the surrounding stack
(React + Vite + TS + Tailwind) but leaves the editor library open. Candidates:

1. **Custom `contentEditable`** — build selection, IME, undo/redo, and paste
   sanitization from scratch.
2. **Slate.js** — low-level, flexible document model.
3. **TipTap** — ProseMirror-based, headless, extension-per-node, JSON-serializing.

## Decision

We will use **TipTap**.

## Rationale

- **Block-as-node model.** TipTap exposes each node type through a dedicated
  extension with its own schema, attributes, and serialization. This maps
  directly onto our `blocks` table: one node = one row, `content` = node attrs.
  A custom editor or a flatter model would force us to write that mapping by hand.
- **ProseMirror underneath.** Selection, IME, collaborative-editing primitives,
  and undo/redo are battle-tested. Rebuilding them in a custom editor is out of
  scope for a clone and a known source of subtle bugs (cursor jumps, paste
  explosions, mobile IME breakage).
- **Headless & Tailwind-friendly.** TipTap ships no styling, so we can hit
  Notion pixel parity with Tailwind — a constitution requirement (§1: match
  Notion's behavior and look).
- **JSON serialization.** `editor.getJSON()` / `setContent()` round-trips the
  document, which lines up with `shared/block-schema.ts` and the autosave flow.
- **First-class TypeScript + Vite support.** No Next.js dependency, no CRA —
  fits the constitution's fixed stack.
- **Slash menu & floating menu.** Provided as official extensions, dramatically
  reducing Task 6's surface area.

Slate was a strong second choice, but its API churn across major versions and
its document-centric (rather than block-centric) tree model would mean more
plumbing for the same outcome.

## Consequences

- **Positive:** faster Task 6 delivery; consistent JSON shape between frontend
  and backend; reliable editing primitives.
- **Negative:** a ProseMirror learning curve; editor bundle size grows with
  extensions (mitigated by importing only what we use).
- **Neutral:** we commit to modeling each block type as a TipTap node extension
  that mirrors a variant in `shared/block-schema.ts`. Future block types require
  touching both files.

## Alternatives considered

| Option | Verdict |
|--------|---------|
| Custom `contentEditable` | Rejected — too costly to rebuild selection/IME/undo for the block set we need. |
| Slate.js | Rejected — document-centric model and version churn add risk vs. TipTap's block-friendly, stable API. |
| Lexical | Not in the candidate set per the master prompt; reconsider only if TipTap proves inadequate. |
