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
  | "table_row";
export type ShareType = "USER" | "PUBLIC_LINK";
export type PageAccess = "OWNER" | "EDITOR" | "VIEWER";
export type PropertyType = "text" | "number" | "select" | "date" | "checkbox" | "url";

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
}

export interface DatabaseRowDTO {
  page_id: string;
  title: string;
  values: PropertyValueDTO[];
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
