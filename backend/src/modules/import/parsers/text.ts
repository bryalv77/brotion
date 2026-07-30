import type { ParsedDocument } from "./types.js";

/**
 * Parse plain text (.txt) into blocks.
 * Each non-empty line becomes a paragraph block. Consecutive empty lines
 * are collapsed. The first non-empty line becomes the page title.
 */
export function parseText(source: string): ParsedDocument {
  const lines = source.split(/\r?\n/);
  const blocks: ParsedDocument["blocks"] = [];
  let title = "Imported text";

  let firstContent = true;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      if (firstContent) {
        title = trimmed.slice(0, 200);
        firstContent = false;
      }
      blocks.push({
        type: "paragraph",
        content: {
          type: "paragraph",
          rich_text: [{ kind: "text", text: trimmed }],
        },
      });
    }
  }

  return { title, blocks, images: [] };
}
