import { z } from "zod";

export const createDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
});

export const updateDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(20).nullable().optional(),
});

/**
 * `options` shape depends on `type`:
 *   - select / multi_select / status: `{ options: SelectOption[] }` (each
 *     { value, color? }); the legacy `string[]` shape is also accepted for
 *     backward compatibility and normalized to `[{value}]`.
 *   - formula: `{ formula: string }` — the formula source
 *   - everything else: optional, ignored
 */
const propertyOptionsSchema = z.union([
  // New structured shape: { options: [{ value, color? }] } OR legacy string[].
  z.object({
    options: z.array(
      z.union([
        z.string().min(1).max(100),
        z.object({ value: z.string().min(1).max(100), color: z.string().max(40).optional() }),
      ]),
    ).max(200),
  }),
  z.object({ formula: z.string().max(2000) }),
  z.null(),
  z.undefined(),
]);

export const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "text",
    "number",
    "select",
    "multi_select",
    "status",
    "date",
    "checkbox",
    "url",
    "formula",
    "relation",
    "rollup",
    "created_time",
    "created_by",
    "last_edited_time",
    "last_edited_by",
  ]),
  options: propertyOptionsSchema.optional(),
  // relation: target database id (validated same-workspace in the service).
  relation_database_id: z.string().optional(),
  // rollup: { relation_property_id, target_property_id, aggregation }.
  rollup_config: z
    .object({
      relation_property_id: z.string(),
      target_property_id: z.string(),
      aggregation: z.enum(["sum", "avg", "min", "max", "count", "show_original"]),
    })
    .optional(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  options: propertyOptionsSchema.optional(),
});

export const updatePropertyValueSchema = z.object({
  value: z.unknown(),
});

/**
 * Body for POST /databases/:id/rows. `template_id` optionally instantiates a
 * specific template; null/omitted falls back to the database's default template
 * (or an empty row if there is none).
 */
export const createRowSchema = z.object({
  template_id: z.string().nullable().optional(),
});

/** Body for POST /databases/:id/templates. */
export const createTemplateSchema = z.object({
  name: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
});

/**
 * Body for PATCH /databases/:id/templates/:id. `default_values` is a loose
 * { property_id: value } map; the service validates that each property belongs
 * to the database and is an editable type.
 */
export const updateTemplateSchema = z.object({
  name: z.string().max(200).optional(),
  icon: z.string().max(20).nullable().optional(),
  is_default: z.boolean().optional(),
  default_values: z.record(z.string(), z.unknown()).optional(),
});

/** Body for the property/row reorder endpoints: before_id and/or after_id. */
export const reorderSchema = z.object({
  before_id: z.string().optional(),
  after_id: z.string().optional(),
});

/** Body for view create/update. `config` is a loose object (validated in use). */
const viewConfigSchema = z
  .object({
    filters: z
      .array(
        z.object({
          property: z.string(),
          op: z.string(),
          value: z.unknown().optional(),
        }),
      )
      .optional(),
    sorts: z
      .array(z.object({ property: z.string(), direction: z.enum(["asc", "desc"]) }))
      .optional(),
    group_by: z.string().nullable().optional(),
    hidden: z.array(z.string()).optional(),
  })
  .optional();

export const createViewSchema = z.object({
  name: z.string().max(100).optional(),
  type: z.enum(["table", "list", "board", "gallery"]).optional(),
  config: viewConfigSchema,
});

export const updateViewSchema = z.object({
  name: z.string().max(100).optional(),
  type: z.enum(["table", "list", "board", "gallery"]).optional(),
  config: viewConfigSchema,
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;
export type UpdateDatabaseInput = z.infer<typeof updateDatabaseSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type UpdatePropertyValueInput = z.infer<typeof updatePropertyValueSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type CreateRowInput = z.infer<typeof createRowSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
