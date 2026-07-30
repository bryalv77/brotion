import MarkdownIt from "markdown-it";
import type { ParsedBlock, ParsedDocument } from "./types.js";

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

/**
 * Parse a Markdown string into block definitions.
 * Uses markdown-it's token stream to map MD elements to our block types.
 */
export function parseMarkdown(source: string): ParsedDocument {
  const tokens = md.parse(source, {});
  const blocks: ParsedBlock[] = [];
  let title = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // heading_open → heading content → heading_close
    if (token.type === "heading_open") {
      const level = Number(token.tag.replace("h", ""));
      const inlineToken = tokens[i + 1];
      const richText = inlineTokenToRichText(inlineToken);
      const text = richText.map((r) => r.text).join("");
      if (level === 1 && !title) title = text;
      blocks.push({
        type: `heading${Math.min(level, 3)}`,
        content: { type: `heading${Math.min(level, 3)}`, rich_text: richText },
      });
      i += 2; // skip inline + heading_close
      continue;
    }

    // paragraph_open → paragraph content → paragraph_close
    if (token.type === "paragraph_open") {
      const inlineToken = tokens[i + 1];
      const richText = inlineTokenToRichText(inlineToken);
      const text = richText.map((r) => r.text).join("");

      // Detect task list items: - [ ] or - [x]
      const todoMatch = text.match(/^\[([x ])\]\s*(.*)/i);
      if (todoMatch) {
        blocks.push({
          type: "todo",
          content: {
            type: "todo",
            rich_text: [{ kind: "text", text: todoMatch[2] }],
            checked: todoMatch[1].toLowerCase() === "x",
          },
        });
      } else {
        blocks.push({
          type: "paragraph",
          content: { type: "paragraph", rich_text: richText },
        });
      }
      i += 2;
      continue;
    }

    // bullet list items
    if (token.type === "bullet_list_open") {
      i++;
      while (i < tokens.length && tokens[i].type !== "bullet_list_close") {
        if (tokens[i].type === "list_item_open") {
          const inline = findInline(tokens, i);
          if (inline) {
            blocks.push({
              type: "bulleted_list_item",
              content: {
                type: "bulleted_list_item",
                rich_text: inlineTokenToRichText(inline),
              },
            });
          }
        }
        i++;
      }
      continue;
    }

    // ordered list items
    if (token.type === "ordered_list_open") {
      i++;
      while (i < tokens.length && tokens[i].type !== "ordered_list_close") {
        if (tokens[i].type === "list_item_open") {
          const inline = findInline(tokens, i);
          if (inline) {
            blocks.push({
              type: "numbered_list_item",
              content: {
                type: "numbered_list_item",
                rich_text: inlineTokenToRichText(inline),
              },
            });
          }
        }
        i++;
      }
      continue;
    }

    // blockquote
    if (token.type === "blockquote_open") {
      i++;
      while (i < tokens.length && tokens[i].type !== "blockquote_close") {
        if (tokens[i].type === "paragraph_open") {
          const inline = tokens[i + 1];
          if (inline) {
            blocks.push({
              type: "quote",
              content: { type: "quote", rich_text: inlineTokenToRichText(inline) },
            });
          }
          i += 2;
        } else {
          i++;
        }
      }
      continue;
    }

    // fence (code blocks)
    if (token.type === "fence") {
      blocks.push({
        type: "code",
        content: {
          type: "code",
          text: token.content,
          language: token.info || "plaintext",
        },
      });
      continue;
    }

    // hr
    if (token.type === "hr") {
      blocks.push({ type: "divider", content: { type: "divider" } });
      continue;
    }

    // table (GFM)
    if (token.type === "table_open") {
      // Collect until table_close
      const tableBlocks = parseTableTokens(tokens, i);
      blocks.push(...tableBlocks);
      while (i < tokens.length && tokens[i].type !== "table_close") i++;
      continue;
    }
  }

  // Fallback: first line as title if no h1 found
  if (!title) {
    const firstText = blocks.find((b) => b.type === "paragraph" || b.type.startsWith("heading"));
    if (firstText) {
      const rt = firstText.content.rich_text as Array<{ text: string }>;
      title = rt?.map((r) => r.text).join("").slice(0, 100) || "Imported page";
    } else {
      title = "Imported page";
    }
  }

  return { title, blocks, images: [] };
}

/** Convert a markdown-it inline token to our RichText[] format. */
function inlineTokenToRichText(
  inlineToken: unknown,
): Array<{ kind: string; text: string; marks?: string[] }> {
  const token = inlineToken as { children?: Array<{ type: string; content?: string }> } | null;
  if (!token?.children) return [];

  const runs: Array<{ kind: string; text: string; marks?: string[] }> = [];
  let currentMarks: string[] = [];

  for (const child of token.children) {
    if (child.type === "text") {
      runs.push({
        kind: "text",
        text: child.content || "",
        ...(currentMarks.length > 0 ? { marks: [...currentMarks] } : {}),
      });
    } else if (child.type === "code_inline") {
      runs.push({ kind: "text", text: child.content || "", marks: ["code"] });
    } else if (child.type === "strong_open") {
      currentMarks.push("bold");
    } else if (child.type === "strong_close") {
      currentMarks = currentMarks.filter((m) => m !== "bold");
    } else if (child.type === "em_open") {
      currentMarks.push("italic");
    } else if (child.type === "em_close") {
      currentMarks = currentMarks.filter((m) => m !== "italic");
    } else if (child.type === "s_open") {
      currentMarks.push("strike");
    } else if (child.type === "s_close") {
      currentMarks = currentMarks.filter((m) => m !== "strike");
    } else if (child.type === "softbreak" || child.type === "hardbreak") {
      runs.push({ kind: "text", text: "\n" });
    }
  }

  return runs;
}

/** Find the first inline token after a list_item_open. */
function findInline(
  tokens: Array<{ type: string }>,
  start: number,
): { children?: unknown } | undefined {
  for (let j = start + 1; j < tokens.length; j++) {
    if (tokens[j].type === "inline") return tokens[j] as { children?: unknown };
    if (tokens[j].type === "list_item_close") break;
  }
  return undefined;
}

/** Parse GFM table tokens into table + table_row blocks. */
function parseTableTokens(
  tokens: Array<{ type: string; content?: string }>,
  start: number,
): ParsedBlock[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let colCount = 0;

  for (let j = start + 1; j < tokens.length && tokens[j].type !== "table_close"; j++) {
    const t = tokens[j];
    if (t.type === "tr_open") currentRow = [];
    else if (t.type === "tr_close") {
      colCount = Math.max(colCount, currentRow.length);
      rows.push(currentRow);
    } else if (t.type === "inline" && t.content) {
      currentRow.push(t.content);
    }
  }

  const result: ParsedBlock[] = [];
  const tableIndex = start; // placeholder; service resolves indices
  result.push({
    type: "table",
    content: { type: "table", column_count: colCount, has_header_row: rows.length > 0 },
    parentIndex: -1,
  });

  for (const row of rows) {
    result.push({
      type: "table_row",
      content: {
        type: "table_row",
        cells: row.map((cell) => [{ kind: "text", text: cell }]),
      },
      parentIndex: tableIndex,
    });
  }

  return result;
}
