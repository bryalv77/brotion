import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { badRequest, tooLarge } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { importFile } from "../../modules/import/import.service.js";

export const importRoutes = new Hono<AppEnv>();

importRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    throw badRequest("No file uploaded. Field `file` is required.");
  }

  if (file.size > env.MAX_UPLOAD_BYTES) {
    throw tooLarge();
  }

  const parentIdValue = form.get("parent_id");
  const parentId = typeof parentIdValue === "string" ? parentIdValue : undefined;

  const page = await importFile(
    { bucket: c.env.BUCKET, origin: new URL(c.req.url).origin },
    c.req.param("workspaceId")!,
    c.get("user").id,
    file,
    parentId,
  );

  return created(c, { page });
});
