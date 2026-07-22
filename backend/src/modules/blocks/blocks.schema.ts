import { z } from "zod";

/**
 * Block create/patch/reorder schemas. `content` is loosely typed here (a JSON
 * object) because enforcing the full per-type discriminated union at the API
 * boundary would couple validation tightly to the editor; the editor is the
 * producer and the backend trusts its shape. Type checks live in /shared.
 */
export const createBlockSchema = z.object({
  type: z.enum([
    "paragraph",
    "heading1",
    "heading2",
    "heading3",
    "bulleted_list_item",
    "numbered_list_item",
    "todo",
    "quote",
    "callout",
    "divider",
    "code",
    "image",
    "table",
    "table_row",
  ]),
  content: z.record(z.unknown()),
  parent_block_id: z.string().nullable().optional(),
  order: z.number().optional(),
  before_id: z.string().optional(),
  after_id: z.string().optional(),
});

export const updateBlockSchema = z.object({
  content: z.record(z.unknown()).optional(),
  type: z.enum([
    "paragraph",
    "heading1",
    "heading2",
    "heading3",
    "bulleted_list_item",
    "numbered_list_item",
    "todo",
    "quote",
    "callout",
    "divider",
    "code",
    "image",
    "table",
    "table_row",
  ]).optional(),
});

export const reorderBlockSchema = z.object({
  block_id: z.string(),
  before_id: z.string().optional(),
  after_id: z.string().optional(),
  new_parent_block_id: z.string().nullable().optional(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type ReorderBlockInput = z.infer<typeof reorderBlockSchema>;
