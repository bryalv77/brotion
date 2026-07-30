import type { ParsedDocument } from "./types.js";

/**
 * Parse a PDF file buffer into blocks.
 * Uses `unpdf` (server-friendly wrapper around pdf.js) for text extraction.
 * PDFs rarely preserve structure, so output is mostly paragraph blocks.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const { extractText, getDocumentProxy } = await import("unpdf");

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });

  // The extracted text is a flat string; split into paragraphs.
  const text = result.text || "";
  const lines = text.split(/\n/);
  const blocks: ParsedDocument["blocks"] = [];
  let title = "Imported PDF";

  let currentPara = "";
  let firstContent = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      if (firstContent) {
        title = trimmed.slice(0, 200);
        firstContent = false;
      }
      // Accumulate lines into paragraphs (heuristic: short lines may be headings)
      if (trimmed.length < 60 && !trimmed.endsWith(".")) {
        // Could be a heading
        if (currentPara) {
          blocks.push({
            type: "paragraph",
            content: {
              type: "paragraph",
              rich_text: [{ kind: "text", text: currentPara.trim() }],
            },
          });
          currentPara = "";
        }
        blocks.push({
          type: "heading2",
          content: {
            type: "heading2",
            rich_text: [{ kind: "text", text: trimmed }],
          },
        });
      } else {
        currentPara += (currentPara ? " " : "") + trimmed;
      }
    } else {
      // Empty line → paragraph boundary
      if (currentPara) {
        blocks.push({
          type: "paragraph",
          content: {
            type: "paragraph",
            rich_text: [{ kind: "text", text: currentPara.trim() }],
          },
        });
        currentPara = "";
      }
    }
  }

  // Flush remaining
  if (currentPara) {
    blocks.push({
      type: "paragraph",
      content: {
        type: "paragraph",
        rich_text: [{ kind: "text", text: currentPara.trim() }],
      },
    });
  }

  return { title, blocks: blocks.length > 0 ? blocks : [{ type: "paragraph", content: { type: "paragraph", rich_text: [{ kind: "text", text: "(empty PDF)" }] } }], images: [] };
}
