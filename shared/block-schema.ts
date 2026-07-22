/**
 * Block content schema — the shape of `blocks.content` (JSON) for each block type.
 *
 * This is the contract between the TipTap editor (frontend) and the persistence
 * layer (backend). TipTap serializes to JSON; we map its node tree to one row
 * per block with a `content` payload of the matching shape below.
 *
 * Rules:
 * - Every block type has exactly one `*Content` interface.
 * - `BlockContent` is a discriminated union keyed on the `type` field, so the
 *   compiler enforces that a block's content matches its type everywhere.
 * - Inline rich text is shared (`RichText` from api-types.ts) so paragraphs,
 *   headings, quotes, callouts, code, and comments all format the same way.
 */

import type { RichText } from "./api-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Text-bearing blocks
// ─────────────────────────────────────────────────────────────────────────────

export interface ParagraphContent {
  type: "paragraph";
  /** Ordered runs of rich text. Empty array = empty line. */
  rich_text: RichText[];
}

export interface HeadingContent {
  type: "heading1" | "heading2" | "heading3";
  rich_text: RichText[];
}

export interface ListContent {
  type: "bulleted_list_item" | "numbered_list_item";
  rich_text: RichText[];
  /** UI-only: whether nested children are collapsed in the sidebar/editor. */
  collapsed?: boolean;
}

export interface TodoContent {
  type: "todo";
  rich_text: RichText[];
  checked: boolean;
  collapsed?: boolean;
}

export interface QuoteContent {
  type: "quote";
  rich_text: RichText[];
}

export interface CalloutContent {
  type: "callout";
  rich_text: RichText[];
  /** Emoji or icon shown beside the callout. */
  icon?: string;
  /** Tailwind-friendly color key, e.g. "gray" | "blue" | "green" | ... */
  color?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-text blocks
// ─────────────────────────────────────────────────────────────────────────────

export interface DividerContent {
  type: "divider";
}

export interface CodeContent {
  type: "code";
  /** Plain source text (code is not rich text — no inline marks). */
  text: string;
  /** Language key for syntax highlighting, e.g. "ts" | "js" | "python" | "bash". */
  language: string;
  /** Optional caption shown beneath the code block. */
  caption?: RichText[];
}

export interface ImageContent {
  type: "image";
  /** Stable URL returned by POST /files. */
  url: string;
  /** Original file name for alt text / download. */
  alt?: string;
  /** Stored mime type for rendering decisions. */
  mime_type?: string;
  caption?: RichText[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Table — represented as a parent "table" block + N "table_row" child blocks.
// This keeps each row independently editable/reorderable and lets comments
// attach to a row if desired.
// ─────────────────────────────────────────────────────────────────────────────

export interface TableContent {
  type: "table";
  /** Column count; rows are consistent length (padded with empty cells). */
  column_count: number;
  /** Has a header row rendered bold (Notion-style toggle). */
  has_header_row: boolean;
}

export interface TableRowContent {
  type: "table_row";
  /** One rich-text array per column. Length must equal parent's column_count. */
  cells: RichText[][];
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union
// ─────────────────────────────────────────────────────────────────────────────

export type BlockContent =
  | ParagraphContent
  | HeadingContent
  | ListContent
  | TodoContent
  | QuoteContent
  | CalloutContent
  | DividerContent
  | CodeContent
  | ImageContent
  | TableContent
  | TableRowContent;

/** All block types that carry inline rich text (used by search-text extraction). */
export const TEXT_BLOCK_TYPES = [
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulleted_list_item",
  "numbered_list_item",
  "todo",
  "quote",
  "callout",
] as const;

/** Helper: does this block type render children as a nested tree? */
export function canHaveChildren(
  content: BlockContent,
): content is ParagraphContent | ListContent | TodoContent {
  return (
    content.type === "paragraph" ||
    content.type === "bulleted_list_item" ||
    content.type === "numbered_list_item" ||
    content.type === "todo"
  );
}
