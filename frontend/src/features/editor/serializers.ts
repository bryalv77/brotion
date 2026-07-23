import type { BlockDTO, BlockType } from "@notion-clone/shared";

/**
 * Convert API blocks (one row per block) ↔ a TipTap document.
 *
 * Each top-level block becomes a top-level ProseMirror node. The node type and
 * attrs map to the block's type and content. Inline rich text maps to
 * ProseMirror's text+marks model.
 */

// ─── API blocks → TipTap doc ─────────────────────────────────────────────────

type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export function blocksToDoc(blocks: BlockDTO[]): { type: "doc"; content: PMNode[] } {
  // Group table_row blocks under their parent table block for rendering.
  const grouped = groupTableRows(blocks);
  return {
    type: "doc",
    content: grouped.length > 0 ? grouped.map(blockToNode) : [emptyParagraph()],
  };
}

/**
 * Flatten the flat block list so table_row blocks are nested inside their table
 * parent as `_rows`. Top-level blocks whose type is `table_row` without a
 * matching parent are skipped (shouldn't happen with well-formed data).
 */
function groupTableRows(blocks: BlockDTO[]): (BlockDTO & { _rows?: BlockDTO[] })[] {
  const rowsByParent = new Map<string, BlockDTO[]>();
  for (const b of blocks) {
    if (b.type === "table_row" && b.parent_block_id) {
      const existing = rowsByParent.get(b.parent_block_id) ?? [];
      existing.push(b);
      rowsByParent.set(b.parent_block_id, existing);
    }
  }
  return blocks
    .filter((b) => b.type !== "table_row")
    .map((b) => {
      if (b.type === "table" && rowsByParent.has(b.id)) {
        return { ...b, _rows: rowsByParent.get(b.id)! };
      }
      return b;
    });
}

function blockToNode(block: BlockDTO): PMNode {
  const c = block.content as unknown as Record<string, unknown>;
  const richText = Array.isArray(c.rich_text) ? c.rich_text : [];
  const inline = richTextToProseMirror(richText);

  switch (block.type) {
    case "heading1":
    case "heading2":
    case "heading3": {
      const level = Number(block.type.replace("heading", ""));
      return { type: "heading", attrs: { level }, content: inline };
    }
    case "bulleted_list_item":
      return { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: inline }] }] };
    case "numbered_list_item":
      return { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: inline }] }] };
    case "todo":
      return {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: Boolean(c.checked) },
            content: [{ type: "paragraph", content: inline }],
          },
        ],
      };
    case "quote":
      return { type: "blockquote", content: [{ type: "paragraph", content: inline }] };
    case "callout":
      return {
        type: "callout",
        attrs: { icon: c.icon ?? "💡", color: c.color ?? "gray" },
        content: [{ type: "paragraph", content: inline }],
      };
    case "code":
      return {
        type: "codeBlock",
        attrs: { language: c.language ?? "plaintext" },
        content: typeof c.text === "string" ? [{ type: "text", text: c.text }] : [],
      };
    case "divider":
      return { type: "horizontalRule" };
    case "table": {
      // Build a TipTap table from its child table_row blocks.
      // The table_row blocks are passed as the 2nd arg (nestedBlocks).
      const rows = (block as { _rows?: BlockDTO[] })._rows ?? [];
      const hasHeader = Boolean(c.has_header_row);
      const tableRows: PMNode[] = rows.map((rowBlock, rowIdx) => {
        const rowContent = rowBlock.content as unknown as Record<string, unknown>;
        const cells = Array.isArray(rowContent.cells) ? rowContent.cells : [];
        const cellNodes: PMNode[] = cells.map((cellRuns: unknown) => ({
          type: hasHeader && rowIdx === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", content: richTextToProseMirror(cellRuns as unknown[]) }],
        }));
        return { type: "tableRow", content: cellNodes };
      });
      // Tiptap's Table requires at least one tableRow; fall back to a paragraph
      // if grouping produced no rows (orphaned table or data corruption).
      if (tableRows.length === 0) {
        return { type: "paragraph" };
      }
      return { type: "table", content: tableRows };
    }
    case "table_row":
      // table_row blocks are handled by the table case above; standalone rows
      // shouldn't appear at the top level, but render as an empty paragraph.
      return { type: "paragraph" };
    case "image":
      return {
        type: "image",
        attrs: { src: c.url ?? "", alt: c.alt ?? "" },
      };
    default:
      return { type: "paragraph", content: inline };
  }
}

/** Convert API rich_text runs to ProseMirror inline nodes with marks. */
function richTextToProseMirror(
  runs: unknown[],
): PMNode[] {
  return runs.map((run) => {
    const r = run as Record<string, unknown>;
    const text = String(r.text ?? "");
    const marks: { type: string }[] = [];
    if (Array.isArray(r.marks)) {
      for (const m of r.marks) {
        if (typeof m === "string") marks.push({ type: m });
      }
    }
    return marks.length > 0 ? { type: "text", text, marks } : { type: "text", text };
  });
}

function emptyParagraph(): PMNode {
  return { type: "paragraph" };
}

// ─── TipTap doc → API blocks ─────────────────────────────────────────────────

export interface DocBlock {
  type: BlockType;
  content: Record<string, unknown>;
}

export function docToBlocks(doc: { type: string; content?: PMNode[] }): DocBlock[] {
  const nodes = doc.content ?? [];
  const blocks: DocBlock[] = [];
  for (const node of nodes) {
    blocks.push(...nodeToBlocks(node));
  }
  return blocks;
}

function nodeToBlocks(node: PMNode): DocBlock[] {
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      return [{
        type: `heading${level}` as BlockType,
        content: { type: `heading${level}`, rich_text: proseMirrorToRichText(node.content) },
      }];
    }
    case "bulletList":
      return (node.content ?? []).map(() => ({
        type: "bulleted_list_item" as BlockType,
        content: { type: "bulleted_list_item", rich_text: proseMirrorToRichText(extractParagraphs(node.content)) },
      }));
    case "orderedList":
      return (node.content ?? []).map(() => ({
        type: "numbered_list_item" as BlockType,
        content: { type: "numbered_list_item", rich_text: proseMirrorToRichText(extractParagraphs(node.content)) },
      }));
    case "taskList":
      return (node.content ?? []).map((item) => ({
        type: "todo" as BlockType,
        content: {
          type: "todo",
          rich_text: proseMirrorToRichText(extractParagraphs(item.content)),
          checked: Boolean(item.attrs?.checked),
        },
      }));
    case "blockquote":
      return [{
        type: "quote" as BlockType,
        content: { type: "quote", rich_text: proseMirrorToRichText(extractParagraphs(node.content)) },
      }];
    case "codeBlock":
      return [{
        type: "code" as BlockType,
        content: {
          type: "code",
          text: (node.content ?? []).map((n) => n.text ?? "").join("\n"),
          language: String(node.attrs?.language ?? "plaintext"),
        },
      }];
    case "horizontalRule":
      return [{ type: "divider" as BlockType, content: { type: "divider" } }];
    case "image":
      return [{
        type: "image" as BlockType,
        content: {
          type: "image",
          url: String(node.attrs?.src ?? ""),
          alt: node.attrs?.alt ? String(node.attrs.alt) : undefined,
        },
      }];
    case "table": {
      const rows = node.content ?? [];
      const cols = rows[0]?.content?.length ?? 0;
      const blocks: DocBlock[] = [{
        type: "table" as BlockType,
        content: { type: "table", column_count: cols, has_header_row: true },
      }];
      for (const row of rows) {
        const cells = (row.content ?? []).map((cell) =>
          proseMirrorToRichText(extractParagraphs(cell.content)),
        );
        blocks.push({
          type: "table_row" as BlockType,
          content: { type: "table_row", cells },
        });
      }
      return blocks;
    }
    case "paragraph":
    default:
      return [{
        type: "paragraph" as BlockType,
        content: { type: "paragraph", rich_text: proseMirrorToRichText(node.content) },
      }];
  }
}

/** Extract paragraph content from listItem/blockquote wrappers. */
function extractParagraphs(content?: PMNode[]): PMNode[] {
  if (!content) return [];
  for (const child of content) {
    if (child.type === "paragraph") return child.content ?? [];
  }
  return [];
}

/** Convert ProseMirror inline nodes to API rich_text runs. */
function proseMirrorToRichText(nodes?: PMNode[]): unknown[] {
  if (!nodes) return [];
  return nodes
    .filter((n) => n.type === "text" && n.text)
    .map((n) => {
      const marks = (n.marks ?? []).map((m) => m.type);
      return marks.length > 0
        ? { kind: "text", text: n.text, marks }
        : { kind: "text", text: n.text };
    });
}
