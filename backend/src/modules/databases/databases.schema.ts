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
 *   - select: `{ options: string[] }`   allowed values for the cell
 *   - formula: `{ formula: string }`    the formula source
 *   - everything else: optional, ignored
 */
const propertyOptionsSchema = z.union([
  z.object({ options: z.array(z.string().min(1).max(100)).max(200) }),
  z.object({ formula: z.string().max(2000) }),
  z.null(),
  z.undefined(),
]);

export const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["text", "number", "select", "date", "checkbox", "url", "formula"]),
  options: propertyOptionsSchema.optional(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  options: propertyOptionsSchema.optional(),
});

export const updatePropertyValueSchema = z.object({
  value: z.unknown(),
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;
export type UpdateDatabaseInput = z.infer<typeof updateDatabaseSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type UpdatePropertyValueInput = z.infer<typeof updatePropertyValueSchema>;
