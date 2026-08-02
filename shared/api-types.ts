/**
 * Shared API types — the single source of truth for request/response shapes.
 *
 * Both `frontend/src/api` and `backend/src/modules/*` import from here so the
 * two sides can never drift. If a shape changes, change it HERE, then both
 * sides update via TypeScript.
 *
 * These types intentionally mirror `shared/contracts.md`. On any divergence,
 * this file is authoritative (it is what the compiler enforces).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Response envelope
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    /** Present on 5xx so the client can show a reference id; never leaks stack. */
    errorId?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────────────────────────────────────
// Enums (mirror Prisma enums — keep in sync)
// ─────────────────────────────────────────────────────────────────────────────

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "todo"
  | "quote"
  | "callout"
  | "divider"
  | "code"
  | "image"
  | "table"
  | "table_row"
  | "page_ref";
export type ShareType = "USER" | "PUBLIC_LINK";
export type PageAccess = "OWNER" | "EDITOR" | "VIEWER";
export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "checkbox"
  | "url"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by";

export type ViewType = "table" | "list" | "board" | "gallery";

/** Property types that are stored (have editable PropertyValue rows). */
export type StoredPropertyType = Exclude<
  PropertyType,
  "formula" | "rollup" | "created_time" | "created_by" | "last_edited_time" | "last_edited_by"
>;

// A view config: filters + sorts + grouping + hidden columns.
export type FilterOp =
  | "eq"
  | "ne"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty"
  | "any_of"
  | "none_of";

export interface Filter {
  /** Property NAME the filter applies to. */
  property: string;
  op: FilterOp;
  /** type-appropriate value: string | number | boolean | string[] | null. */
  value?: string | number | boolean | string[] | null;
}

export interface Sort {
  /** Property NAME to sort by. */
  property: string;
  direction: "asc" | "desc";
}

export interface ViewConfig {
  filters: Filter[];
  sorts: Sort[];
  /** Property NAME to group by (Board view; must be a select/status/multi_select). */
  group_by?: string | null;
  /** Property NAMES to hide in this view. */
  hidden?: string[];
}

export interface DatabaseViewDTO {
  id: string;
  database_id: string;
  name: string;
  type: ViewType;
  config: ViewConfig;
  order: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  icon: string | null;
  /** The caller's role in this workspace. */
  role: WorkspaceRole;
}

export interface PageSummaryDTO {
  id: string;
  title: string;
  icon: string | null;
  parent_id: string | null;
  has_children: boolean;
}

export interface PageDTO extends PageSummaryDTO {
  workspace_id: string;
  cover_url: string | null;
  is_deleted: boolean;
  created_by: string;
  created_at: string; // ISO
  updated_at: string; // ISO
  /** Present when this page is a row of a database (drives the row property panel). */
  database_id?: string | null;
}

export interface BlockDTO {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: BlockType;
  /** Type-specific payload — see `block-schema.ts`. */
  content: BlockContent;
  /** Fractional-indexable position within its parent. */
  order: number;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface AttachmentDTO {
  id: string;
  url: string;
  mime_type: string;
  size_bytes: number;
}

export interface PermissionDTO {
  id: string;
  page_id: string;
  user_id: string | null;
  share_type: ShareType;
  access: PageAccess;
  inherit: boolean;
  /** Present only when share_type === "PUBLIC_LINK". */
  token: string | null;
}

export interface CommentDTO {
  id: string;
  block_id: string;
  page_id: string;
  user: UserDTO;
  body: RichText[];
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchResultDTO {
  page_id: string;
  title: string;
  snippet: string;
  rank: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Database DTOs (Task 012)
// ─────────────────────────────────────────────────────────────────────────────

export interface PropertyDTO {
  id: string;
  database_id: string;
  name: string;
  type: PropertyType;
  options?: unknown;
  /** For `relation` props: the target database id. */
  relation_database_id?: string | null;
  /** For `rollup` props: { relation_property_id, target_property_id, aggregation }. */
  rollup_config?: {
    relation_property_id: string;
    target_property_id: string;
    aggregation: "sum" | "avg" | "min" | "max" | "count" | "show_original";
  } | null;
  order: number;
}

export interface PropertyValueDTO {
  id: string;
  property_id: string;
  value: unknown;
}

export interface DatabaseDTO {
  id: string;
  page_id: string;
  workspace_id: string;
  title: string;
  icon: string | null;
  properties: PropertyDTO[];
  rows: DatabaseRowDTO[];
  views: DatabaseViewDTO[];
  /** Templates defined on this database (factory rows for new pages). Optional —
   * included by `getDatabase`/`createDatabase`; some listings omit it. */
  templates?: TemplateDTO[];
}

export interface DatabaseRowDTO {
  page_id: string;
  title: string;
  values: PropertyValueDTO[];
  /** Per-formula-cell computed result. Keyed by property_id. */
  computed?: Record<string, ComputedCell>;
}

/**
 * A Template is a factory that produces new database rows (pages) by deep-copy.
 * Its block body lives on a hidden page (`page_id`, with `is_template=true` on
 * the server); applying a template copies that body + `default_values` onto a
 * freshly created row. Once instantiated, the row is fully independent of the
 * template — there is no later synchronization (factory/prototype semantics).
 */
export interface TemplateDTO {
  id: string;
  database_id: string;
  name: string;
  icon: string | null;
  /** The hidden page (is_template=true) whose block tree is copied on apply. */
  page_id: string;
  /** Initial property values applied on instantiation: { property_id: value }.
   * Only editable property types are stored (formula/rollup/system excluded). */
  default_values: Record<string, unknown>;
  is_default: boolean;
}

export type ComputedCellStatus = "ok" | "error";

export interface ComputedCell {
  status: ComputedCellStatus;
  // Scalars for formula/rollup; arrays/objects for relation summaries and
  // show_original rollups.
  value?: string | number | boolean | null | unknown[];
  error?: {
    code:
      | "parse"
      | "type"
      | "circular"
      | "unknown_property"
      | "division_by_zero";
    message: string;
  };
}

/** Value stored on a `Property` whose `type === "formula"`. */
export interface FormulaValue {
  formula: string;
}

/** Select / multi_select / status option (with an optional Tailwind color token). */
export interface SelectOption {
  value: string;
  color?: string;
}

/** Body for POST /databases/:id/properties/:id/move and /databases/:id/rows/:id/move. */
export interface ReorderRequest {
  before_id?: string;
  after_id?: string;
}

/** Body for POST /databases/:id/views. */
export interface CreateViewRequest {
  name?: string;
  type?: ViewType;
  config?: ViewConfig;
}

/** Body for PATCH /databases/:id/views/:id. */
export interface UpdateViewRequest {
  name?: string;
  type?: ViewType;
  config?: ViewConfig;
}

/** Body for POST /databases/:id/rows. Omit `template_id` (or pass null) for an
 * empty row; pass a template id to instantiate that template's body + defaults.
 * If no `template_id` is given but the database has a default template, that
 * template is applied automatically (Notion-style). */
export interface CreateRowRequest {
  template_id?: string | null;
}

/** Body for POST /databases/:id/templates. */
export interface CreateTemplateRequest {
  name?: string;
  icon?: string;
}

/** Body for PATCH /databases/:id/templates/:id.
 * `default_values` is a { property_id: value } map; only editable property
 * types are stored (formula/rollup/system types are rejected server-side). */
export interface UpdateTemplateRequest {
  name?: string;
  icon?: string | null;
  is_default?: boolean;
  default_values?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich text (inline content — used inside block.content and comments)
// ─────────────────────────────────────────────────────────────────────────────

export type RichText =
  | TextRichText
  | MentionRichText
  | LinkRichText;

export interface TextRichText {
  kind: "text";
  text: string;
  marks?: TextMark[];
}

export interface MentionRichText {
  kind: "mention";
  /** "user" | "page" — resolves via the API client. */
  mention_type: "user" | "page";
  ref_id: string;
  label: string;
}

export interface LinkRichText {
  kind: "link";
  href: string;
  text: string;
}

export type TextMark = "bold" | "italic" | "underline" | "strike" | "code" | "color";

// ─────────────────────────────────────────────────────────────────────────────
// Block content (type-specific). See block-schema.ts for full docs.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BlockContent,
  ParagraphContent,
  HeadingContent,
  ListContent,
  TodoContent,
  QuoteContent,
  CalloutContent,
  DividerContent,
  CodeContent,
  ImageContent,
  TableContent,
  TableRowContent,
} from "./block-schema.js";

export type {
  BlockContent,
  ParagraphContent,
  HeadingContent,
  ListContent,
  TodoContent,
  QuoteContent,
  CalloutContent,
  DividerContent,
  CodeContent,
  ImageContent,
  TableContent,
  TableRowContent,
};

// ─────────────────────────────────────────────────────────────────────────────
// Request bodies
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  icon?: string;
}

export interface CreatePageRequest {
  parent_id?: string | null;
  title?: string;
  icon?: string;
  cover_url?: string;
}

export interface UpdatePageRequest {
  title?: string;
  icon?: string;
  cover_url?: string;
  // parent_id is accepted for reparenting (the move flow), though the canonical
  // path is POST /pages/:id/move via MovePageRequest, which also enforces the
  // cycle guard. Kept here so callers can pass it through the typed PATCH path.
  parent_id?: string | null;
}

/** Body for POST /pages/:pageId/move — reparents a page (null = workspace root). */
export interface MovePageRequest {
  new_parent_id: string | null;
}

/** Response for GET /pages/:pageId/ancestors — ancestor chain root→leaf (excludes self). */
export interface BreadcrumbsResponse {
  breadcrumbs: PageSummaryDTO[];
}

export interface CreateBlockRequest {
  type: BlockType;
  content: BlockContent;
  parent_block_id?: string | null;
  order?: number;
  /** If both omitted, append to end of parent. */
  before_id?: string;
  after_id?: string;
}

export interface UpdateBlockRequest {
  content?: BlockContent;
  type?: BlockType;
}

export interface ReorderBlockRequest {
  block_id: string;
  before_id?: string;
  after_id?: string;
  new_parent_block_id?: string | null;
}

export interface CreatePermissionRequest {
  user_id?: string;
  share_type: ShareType;
  access: PageAccess;
  inherit?: boolean;
}

export interface CreateCommentRequest {
  block_id: string;
  body: RichText[];
}

export interface UpdateCommentRequest {
  body?: RichText[];
  resolved?: boolean;
}
