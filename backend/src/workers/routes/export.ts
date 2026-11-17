import { Hono } from "hono";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Page, Block } from "@prisma/client";
import type { AppEnv } from "../types.js";
import { requireAuth } from "../middleware.js";
import { badRequest } from "../../utils/errors.js";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../../modules/auth/permissions.service.js";
import { toMarkdown } from "../../modules/export/export.service.js";

/**
 * Worker port of the Express page-export route.
 * - md: pure TypeScript via toMarkdown().
 * - pdf: Puppeteer cannot run on Workers, so a simple valid PDF is produced
 *   with pdf-lib containing the page title and each block's plain text.
 */

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

  const bytes = await buildPdf(page, blocks);
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
    },
  });
});

/** Extract readable text from a block (rich_text runs, or code block text). */
function blockPlainText(block: Block): string {
  const content = block.content as Record<string, unknown>;
  if (typeof content.text === "string" && content.text.trim()) {
    return content.text;
  }
  const richText = Array.isArray(content.rich_text) ? content.rich_text : [];
  return richText
    .map((run) => String((run as Record<string, unknown>).text ?? ""))
    .join("");
}

/** Helvetica (WinAnsi) cannot encode arbitrary Unicode — keep printable ASCII. */
function sanitize(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "?").trim();
}

/** Build a minimal, valid multi-page PDF with the title and block text. */
async function buildPdf(page: Page, blocks: Block[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let pdfPage = pdfDoc.addPage();
  let { width, height } = pdfPage.getSize();
  const margin = 50;
  let y = height - margin;

  const newPageIfNeeded = (size: number) => {
    if (y >= margin + size) return;
    pdfPage = pdfDoc.addPage();
    ({ width, height } = pdfPage.getSize());
    y = height - margin;
  };

  const draw = (rawText: string, size: number) => {
    const text = sanitize(rawText);
    if (!text) return;

    const maxWidth = width - margin * 2;
    let line = "";
    for (const word of text.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        newPageIfNeeded(size);
        pdfPage.drawText(line, { x: margin, y, size, font });
        y -= size * 1.4;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      newPageIfNeeded(size);
      pdfPage.drawText(line, { x: margin, y, size, font });
      y -= size * 1.4;
    }
  };

  draw(page.title || "Untitled", 20);
  y -= 10;
  for (const block of blocks) {
    draw(blockPlainText(block), 12);
  }

  return pdfDoc.save();
}
