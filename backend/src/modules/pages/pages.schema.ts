import { z } from "zod";

export const createPageSchema = z.object({
  parent_id: z.string().nullable().optional(),
  title: z.string().max(500).optional(),
  icon: z.string().max(20).optional(),
  cover_url: z.string().max(2000).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().max(500).optional(),
  icon: z.string().max(20).nullable().optional(),
  cover_url: z.string().max(2000).nullable().optional(),
  // Reparenting flows through the dedicated POST /pages/:id/move endpoint
  // (which runs the cycle guard). PATCH technically accepts it so the typed
  // request shape stays accurate, but updatePage ignores it.
  parent_id: z.string().nullable().optional(),
});

/** Body for POST /pages/:pageId/move — null new_parent_id moves to workspace root. */
export const movePageSchema = z.object({
  new_parent_id: z.string().nullable(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type MovePageInput = z.infer<typeof movePageSchema>;
