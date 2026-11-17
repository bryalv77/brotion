import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { requireAuth } from "../middleware.js";
import { badRequest } from "../../utils/errors.js";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../../modules/auth/permissions.service.js";
import { toMarkdown, toPdf } from "../../modules/export/export.service.js";

export const exportRoutes = new Hono<AppEnv>();

exportRoutes.get("/", requireAuth, async (c) => {
  const format = String(c.req.query("format") ?? "md").toLowerCase();
  if (format !== "md" && format !== "pdf") {
    throw badRequest("Invalid format. Use 'md' or 'pdf'.");
  }

  const { page } = await getAccessiblePage(
    c.req.param("pageId")!,
    c.get("user").id,
    { minAccess: "VIEWER" },
  );

  const blocks = await getPrisma().block.findMany({
    where: { page_id: page.id },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });

  const safeTitle = (page.title || "untitled").replace(/[^a-zA-Z0-9-_]/g, "_");

  if (format === "md") {
    const md = toMarkdown(page, blocks);
    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
      },
    });
  }

  const bytes = await toPdf(page, blocks);
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
    },
  });
});
