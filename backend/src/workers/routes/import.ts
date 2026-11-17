import { Hono } from "hono";
import { Buffer } from "node:buffer";
import type { AppEnv } from "../types.js";
import { created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { badRequest } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { importFile } from "../../modules/import/import.service.js";

/**
 * Worker port of the Express file-import route. The multipart File is read
 * into a Buffer (available via nodejs_compat) so the existing import service
 * and its parsers (.md/.txt/.docx/.pdf/.xlsx) can be reused unchanged. The
 * service itself selects the parser from its `parsers/` directory.
 */

export const importRoutes = new Hono<AppEnv>();

importRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    throw badRequest("No file uploaded. Field `file` is required.");
  }

  if (file.size > env.MAX_UPLOAD_BYTES) {
    throw badRequest("File is too large.", {
      code: "TOO_LARGE",
      maxBytes: env.MAX_UPLOAD_BYTES,
    });
  }

  const parentIdValue = form.get("parent_id");
  const parentId = typeof parentIdValue === "string" ? parentIdValue : undefined;

  const buffer = Buffer.from(await file.arrayBuffer());
  const page = await importFile(
    c.req.param("workspaceId")!,
    c.get("user").id,
    { originalname: file.name, buffer },
    parentId,
  );

  return created(c, { page });
});
