import type { Request, Response } from "express";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { getPrisma } from "../../prisma/client.js";
import { toMarkdown, toPdf } from "./export.service.js";
import { toBlockDTO } from "../pages/pages.dto.js";
import { badRequest } from "../../utils/errors.js";

/** GET /pages/:pageId/export?format=md|pdf */
export async function exportPageHandler(req: Request, res: Response): Promise<void> {
  const format = String(req.query.format ?? "md").toLowerCase();
  if (format !== "md" && format !== "pdf") {
    throw badRequest("Invalid format. Use 'md' or 'pdf'.");
  }

  const { page } = await getAccessiblePage(req.params.pageId, req.user!.id, {
    minAccess: "VIEWER",
  });

  const blocks = await getPrisma().block.findMany({
    where: { page_id: page.id },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });

  const safeTitle = (page.title || "untitled").replace(/[^a-zA-Z0-9-_]/g, "_");

  if (format === "md") {
    const md = toMarkdown(page, blocks);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.md"`,
    );
    res.send(md);
    return;
  }

  // PDF
  const pdfBuffer = await toPdf(page, blocks);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeTitle}.pdf"`,
  );
  res.send(pdfBuffer);

  // Silence unused import warning — toBlockDTO is available for future use.
  void toBlockDTO;
}
