import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { isValidStorageKey, mimeForKey, storeUpload } from "../../modules/files/files.service.js";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../../modules/auth/permissions.service.js";

export const filesRoutes = new Hono<AppEnv>();

filesRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    throw badRequest("No file uploaded. Field `file` is required.");
  }
  const pageId = form.get("page_id");
  const blockId = form.get("block_id");

  const attachment = await storeUpload(c.env.BUCKET, {
    file,
    userId: c.get("user").id,
    origin: new URL(c.req.url).origin,
    pageId: typeof pageId === "string" ? pageId : undefined,
    blockId: typeof blockId === "string" ? blockId : undefined,
  });
  return created(c, { attachment });
});

filesRoutes.get("/:key", requireAuth, async (c) => {
  const key = c.req.param("key");
  const object = isValidStorageKey(key) ? await c.env.BUCKET.get(key) : null;
  if (!object) throw notFound("File not found.");
  return new Response(await object.arrayBuffer(), {
    headers: { "Content-Type": mimeForKey(key) },
  });
});

/** GET /pages/:pageId/attachments — mounted by app.ts from this module. */
export const attachmentsRoutes = new Hono<AppEnv>();

attachmentsRoutes.get("/", requireAuth, async (c) => {
  const { page } = await getAccessiblePage(c.req.param("pageId")!, c.get("user").id, {
    minAccess: "VIEWER",
  });

  const attachments = await getPrisma().attachment.findMany({
    where: { page_id: page.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      file_name: true,
      mime_type: true,
      size_bytes: true,
      url: true,
      created_at: true,
    },
  });

  return ok(c, { attachments });
});
