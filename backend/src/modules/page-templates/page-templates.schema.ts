import { z } from "zod";

export const instantiatePageTemplateSchema = z.object({
  parent_id: z.string().nullable(),
});

export type InstantiatePageTemplateInput = z.infer<typeof instantiatePageTemplateSchema>;
