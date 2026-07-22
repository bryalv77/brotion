import { z } from "zod";

export const createPermissionSchema = z
  .object({
    user_id: z.string().optional(),
    share_type: z.enum(["USER", "PUBLIC_LINK"]),
    access: z.enum(["EDITOR", "VIEWER"]),
    inherit: z.boolean().optional(),
  })
  .refine((v) => v.share_type === "PUBLIC_LINK" || v.user_id, {
    message: "user_id is required when share_type is USER",
    path: ["user_id"],
  });

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
