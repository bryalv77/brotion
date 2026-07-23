import { z } from "zod";

export const createDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
});

export const updateDatabaseSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(20).nullable().optional(),
});

export const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["text", "number", "select", "date", "checkbox", "url"]),
  options: z.unknown().optional(),
});

export const updatePropertyValueSchema = z.object({
  value: z.unknown(),
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;
export type UpdateDatabaseInput = z.infer<typeof updateDatabaseSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyValueInput = z.infer<typeof updatePropertyValueSchema>;
