import type { BlockContent, PropertyType, RichText, ViewType } from "@notion-clone/shared";

/**
 * A template-local string key standing in for a real database id. The
 * factory (`page-templates.service.ts`) resolves every `TplKey` to a real id
 * during instantiation; keys only need to be unique within their own
 * template (enforced by a unit test over `ALL_PAGE_TEMPLATES`).
 */
export type TplKey = string;

/**
 * `page_ref` blocks in template data point at a `TplKey` instead of a real
 * page id (resolved by the factory's pages∪rows key map).
 */
export type TplBlockContent = Exclude<BlockContent, { type: "page_ref" }> | {
  type: "page_ref";
  page_id: TplKey;
  title: string;
  icon?: string;
};

export interface TplBlockNode {
  /** Only needed if this block is the target of a `page_ref` elsewhere. */
  key?: TplKey;
  content: TplBlockContent;
  /** Only meaningful where `canHaveChildren()` (from `block-schema.ts`) holds. */
  children?: TplBlockNode[];
  /** Only for `content.type === "table"` — becomes `table_row` children. */
  rows?: { cells: RichText[][] }[];
}

export interface TplPageDefinition {
  key: TplKey;
  /** null => this page's real parent is the `parent_id` passed at instantiation. */
  parentKey: TplKey | null;
  title: string;
  icon?: string;
  blocks: TplBlockNode[];
}

/**
 * `options` must already be in the exact shape the DB stores for that
 * property type (the factory does not run `normalizeSelectOptions`):
 *   - select | multi_select | status → { options: { value: string; color?: string }[] }
 *   - formula                        → { formula: string }
 *   - anything else                  → omit
 */
export interface TplPropertyDefinition {
  /**
   * Targeted by relation/rollup refs and row `values` keys — NOT by name.
   * Only needs to be unique WITHIN this database (every database
   * conventionally has a property keyed "name"), unlike every other `TplKey`
   * in this file, which must be unique across the whole template.
   */
  key: TplKey;
  name: string;
  type: PropertyType;
  options?: unknown;
  /** Required iff type === "relation". */
  relationDatabaseKey?: TplKey;
  /** Required iff type === "rollup". */
  rollup?: {
    /** A `relation` property key on the SAME database. */
    relationPropertyKey: TplKey;
    /** A property key on the RELATED database. */
    targetPropertyKey: TplKey;
    aggregation: "sum" | "avg" | "min" | "max" | "count" | "show_original";
  };
}

export interface TplViewDefinition {
  name: string;
  type: ViewType; // table | list | board | gallery — no calendar
  config: {
    filters?: unknown[];
    sorts?: unknown[];
    group_by?: string;
    hidden?: string[];
  };
}

export interface TplRowDefinition {
  /** Targeted by relation cell values on other rows. */
  key: TplKey;
  title: string;
  icon?: string;
  /**
   * Keyed by property `key` (not name). Rollup/formula properties never
   * appear here — they're computed. A `relation` value is `{ __relation:
   * TplKey[] }` referencing other rows' keys (same or different database).
   */
  values: Record<TplKey, string | number | boolean | string[] | { __relation: TplKey[] }>;
  /** Optional block content for the row's own page. */
  body?: TplBlockNode[];
}

export interface TplDatabaseDefinition {
  key: TplKey;
  hostPageKey: TplKey;
  title: string;
  icon?: string;
  properties: TplPropertyDefinition[];
  views: TplViewDefinition[];
  rows: TplRowDefinition[];
}

export interface PageTemplateDefinition {
  /** Also the `:templateId` route param — must be unique across the registry. */
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  /** Gallery card accent placeholder (no real preview image in this feature). */
  previewColor: string;
  /** pages[0] is the root page, created under the caller's `parent_id`. */
  pages: TplPageDefinition[];
  databases: TplDatabaseDefinition[];
}
