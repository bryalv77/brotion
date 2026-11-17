import { z } from "zod";

/**
 * Request-body schema for POST /me/adopt-local — the guest→account merge.
 * Validated at the route boundary; unknown keys are stripped by zod, so
 * client-only fields the server doesn't need (e.g. `has_children`) drop off.
 *
 * Limits guard against absurd payloads; they sit far above a real personal
 * notebook so a genuine merge never trips them.
 */

const MAX_WORKSPACES = 50;
const MAX_PAGES = 5_000;
const MAX_BLOCKS = 50_000;
const MAX_DATABASES = 500;

const isoString = z.string().datetime({ offset: true }).or(
  // Local clients write plain toISOString() output (Z suffix); also accept
  // any date-time the JSON.stringify(new Date()) path can produce.
  z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
);

export const adoptLocalSchema = z.object({
  workspaces: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        name: z.string().max(200),
        icon: z.string().max(64).nullable().optional(),
      }),
    )
    .max(MAX_WORKSPACES),
  pages: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        workspace_id: z.string().min(1).max(64),
        parent_id: z.string().min(1).max(64).nullable().optional(),
        title: z.string().max(2000).optional(),
        icon: z.string().max(64).nullable().optional(),
        cover_url: z.string().max(2048).nullable().optional(),
        is_deleted: z.boolean().optional(),
        deleted_at: isoString.nullable().optional(),
        is_template: z.boolean().optional(),
        row_order: z.number().optional(),
        database_id: z.string().min(1).max(64).nullable().optional(),
        created_at: isoString.optional(),
        updated_at: isoString.optional(),
      }),
    )
    .max(MAX_PAGES),
  blocks: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        page_id: z.string().min(1).max(64),
        parent_block_id: z.string().min(1).max(64).nullable().optional(),
        type: z.string().min(1).max(32),
        content: z.unknown(),
        order: z.number(),
        created_at: isoString.optional(),
        updated_at: isoString.optional(),
      }),
    )
    .max(MAX_BLOCKS),
  databases: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        page_id: z.string().min(1).max(64),
        workspace_id: z.string().min(1).max(64),
        title: z.string().max(2000).optional(),
        icon: z.string().max(64).nullable().optional(),
        properties: z.array(
          z.object({
            id: z.string().min(1).max(64),
            name: z.string().min(1).max(200),
            type: z.string().min(1).max(32),
            options: z.unknown().optional(),
            relation_database_id: z.string().min(1).max(64).nullable().optional(),
            rollup_config: z.unknown().nullable().optional(),
            order: z.number().optional(),
          }),
        ),
        views: z.array(
          z.object({
            id: z.string().min(1).max(64),
            name: z.string().max(200).optional(),
            type: z.string().min(1).max(32).optional(),
            config: z.unknown().optional(),
            order: z.number().optional(),
          }),
        ),
        templates: z.array(
          z.object({
            id: z.string().min(1).max(64),
            name: z.string().max(200).optional(),
            icon: z.string().max(64).nullable().optional(),
            page_id: z.string().min(1).max(64),
            default_values: z.unknown().optional(),
            is_default: z.boolean().optional(),
          }),
        ),
      }),
    )
    .max(MAX_DATABASES),
  values: z.array(
    z.object({
      page_id: z.string().min(1).max(64),
      property_id: z.string().min(1).max(64),
      value: z.unknown(),
    }),
  ),
});

export type AdoptLocalInput = z.infer<typeof adoptLocalSchema>;
