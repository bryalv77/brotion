import { z } from "zod";

export const createCommentSchema = z.object({
  block_id: z.string(),
  body: z.array(z.record(z.unknown())),
});

export const updateCommentSchema = z.object({
  body: z.array(z.record(z.unknown())).optional(),
  resolved: z.boolean().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
