import type { Request, Response } from "express";
import { ok } from "../../utils/http.js";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";

/** GET /pages/:pageId/attachments — list attachments for a page. */
export async function listAttachmentsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { page } = await getAccessiblePage(req.params.pageId, req.user!.id, {
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

  ok(res, { attachments });
}
