import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Page, Block } from "@prisma/client";

export function toMarkdown(page: Page, blocks: Block[]): string {
  const lines: string[] = [];

  // Title.
  if (page.icon) lines.push(`# ${page.icon} ${page.title || "Untitled"}\n`);
  else lines.push(`# ${page.title || "Untitled"}\n`);

  for (const block of blocks) {
    lines.push(blockToMarkdown(block));
  }

  return lines.join("\n").trim() + "\n";
}

function blockToMarkdown(block: Block): string {
  const c = block.content as Record<string, unknown>;
  const richText = Array.isArray(c.rich_text) ? c.rich_text : [];
  const text = richTextToMd(richText);

  switch (block.type) {
    case "heading1":
      return `\n# ${text}\n`;
    case "heading2":
      return `\n## ${text}\n`;
    case "heading3":
      return `\n### ${text}\n`;
    case "bulleted_list_item":
      return `- ${text}`;
    case "numbered_list_item":
      return `1. ${text}`;
    case "todo":
      return `- [${c.checked ? "x" : " "}] ${text}`;
    case "quote":
      return `> ${text}`;
    case "callout":
      return `> ${c.icon ?? "💡"} ${text}`;
    case "code":
      return `\n\`\`\`${c.language ?? ""}\n${c.text ?? ""}\n\`\`\`\n`;
    case "divider":
      return `\n---\n`;
    case "table":
    case "table_row":
      // Tables are flattened; skip individual row blocks (the table parent
      // would need its rows grouped — for v1 export we skip table content).
      return "";
    default:
      return text;
  }
}

function richTextToMd(runs: unknown[]): string {
  return runs
    .map((run) => {
      const r = run as Record<string, unknown>;
      let text = String(r.text ?? "");
      const marks = Array.isArray(r.marks) ? (r.marks as string[]) : [];
      if (marks.includes("bold")) text = `**${text}**`;
      if (marks.includes("italic")) text = `*${text}*`;
      if (marks.includes("code")) text = "`" + text + "`";
      if (marks.includes("strike")) text = `~~${text}~~`;
      return text;
    })
    .join("");
}

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
export async function toPdf(page: Page, blocks: Block[]): Promise<Uint8Array> {
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
