import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { getPrisma } from "../../prisma/client.js";
import { toAttachmentDTO } from "../../modules/files/files.dto.js";
import { getAccessiblePage } from "../../modules/auth/permissions.service.js";

/**
 * Worker port of the Express files routes. Uploads go to the R2 `BUCKET`
 * binding instead of local disk; the attachment row is identical to the one
 * written by `storeUpload`.
 */

const ALLOWED = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
  [".md", "text/markdown"],
  [".markdown", "text/markdown"],
  [".txt", "text/plain"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".xls", "application/vnd.ms-excel"],
]);

/** Lowercase file extension including the leading dot (node:path extname equivalent). */
function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
}

/** Same key validation as `resolveStoragePath` in files.service.ts. */
const KEY_RE = /^[A-Za-z0-9-]+\.[A-Za-z0-9]+$/;

export const filesRoutes = new Hono<AppEnv>();

filesRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    throw badRequest("No file uploaded. Field `file` is required.");
  }

  // Same validation order as storeUpload: size first, then extension.
  if (file.size > env.MAX_UPLOAD_BYTES) {
    throw badRequest("File is too large.", {
      code: "TOO_LARGE",
      maxBytes: env.MAX_UPLOAD_BYTES,
    });
  }

  const ext = getExt(file.name);
  if (!ALLOWED.has(ext)) {
    throw badRequest("Unsupported file type.", { code: "UNSUPPORTED_TYPE" });
  }

  const pageIdValue = form.get("page_id");
  const blockIdValue = form.get("block_id");
  const pageId = typeof pageIdValue === "string" ? pageIdValue : undefined;
  const blockId = typeof blockIdValue === "string" ? blockIdValue : undefined;

  const storageKey = `${crypto.randomUUID()}${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await c.env.BUCKET.put(storageKey, bytes);

  const attachment = await getPrisma().attachment.create({
    data: {
      user_id: c.get("user").id,
      page_id: pageId ?? null,
      block_id: blockId ?? null,
      file_name: file.name,
      mime_type: file.type || ALLOWED.get(ext) || "application/octet-stream",
      size_bytes: file.size,
      storage_key: storageKey,
      // Absolute URL: the web app is on Pages, the API on Workers.
      url: `${new URL(c.req.url).origin}/api/v1/files/${storageKey}`,
    },
  });

  return created(c, { attachment: toAttachmentDTO(attachment) });
});

filesRoutes.get("/:key", requireAuth, async (c) => {
  const key = c.req.param("key");
  if (!KEY_RE.test(key)) {
    throw notFound("File not found.");
  }

  const object = await c.env.BUCKET.get(key);
  if (!object) {
    throw notFound("File not found.");
  }

  const mime = ALLOWED.get(getExt(key)) ?? "application/octet-stream";
  const bytes = await object.arrayBuffer();
  return new Response(bytes, { headers: { "Content-Type": mime } });
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
