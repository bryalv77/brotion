import { z } from "zod";

export const createPageSchema = z.object({
  parent_id: z.string().nullable().optional(),
  title: z.string().max(500).optional(),
  icon: z.string().max(20).optional(),
  cover_url: z.string().url().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().max(500).optional(),
  icon: z.string().max(20).nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
