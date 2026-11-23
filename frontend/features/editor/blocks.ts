import type { BlockDTO, BlockType, RichText } from "@notion-clone/shared";

/**
 * Pure helpers for the native block editor.
 *
 * Rich text shapes come straight from `shared/api-types.ts`:
 *   { kind: "text", text, marks? } | { kind: "mention", ... } | { kind: "link", ... }
 * New runs are always a single `{ kind: "text", text }` run; existing runs are
 * never rewritten here (blocks we do not touch are passed through untouched).
 */

/** Build the one plain-text run shape the shared schema expects. */
export function textRun(text: string): RichText {
  return { kind: "text", text };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flatten a RichText[] (or untrusted JSON) into a single display string. */
export function richTextToPlainText(runs: unknown): string {
  if (!Array.isArray(runs)) return "";
  return runs
    .map((run) => {
      if (!isRecord(run)) return "";
      if (run.kind === "mention") {
        return typeof run.label === "string" ? run.label : "";
      }
      return typeof run.text === "string" ? run.text : "";
    })
    .join("");
}

/** Plain-text representation of a block, used for editing and type conversion. */
export function blockToText(block: BlockDTO): string {
  const c = block.content;
  switch (c.type) {
    case "code":
      return c.text;
    case "page_ref":
      return c.title;
    case "divider":
    case "table":
    case "database":
      return "";
    case "image":
      return richTextToPlainText(c.caption);
    case "table_row":
      return c.cells.map(richTextToPlainText).join("\t");
    default:
      return richTextToPlainText(c.rich_text);
  }
}

/**
 * Produce a valid `content` payload for `type`.
 *
 * Fields that are not plain text (todo.checked, callout.icon/color,
 * code.language, image.url/alt/mime_type, page_ref ids, table settings) are
 * carried over from `existing` when present so an edit never drops them.
 */
export function textToContent(
  type: BlockType,
  text: string,
  existing?: BlockDTO,
): Record<string, unknown> {
  const old = existing?.content;
  const rich_text: RichText[] = [textRun(text)];

  switch (type) {
    case "paragraph":
    case "heading1":
    case "heading2":
    case "heading3":
    case "quote":
      return { type, rich_text };

    case "bulleted_list_item":
    case "numbered_list_item": {
      const collapsed =
        old && (old.type === "bulleted_list_item" || old.type === "numbered_list_item")
          ? old.collapsed
          : undefined;
      return { type, rich_text, ...(collapsed !== undefined ? { collapsed } : {}) };
    }

    case "todo": {
      const checked = old && old.type === "todo" ? old.checked : false;
      const collapsed = old && old.type === "todo" ? old.collapsed : undefined;
      return {
        type,
        rich_text,
        checked,
        ...(collapsed !== undefined ? { collapsed } : {}),
      };
    }

    case "callout": {
      const icon = old && old.type === "callout" ? old.icon : undefined;
      const color = old && old.type === "callout" ? old.color : undefined;
      return {
        type,
        rich_text,
        ...(icon !== undefined ? { icon } : {}),
        ...(color !== undefined ? { color } : {}),
      };
    }

    case "divider":
      return { type };

    case "code": {
      const language = old && old.type === "code" ? old.language : "plaintext";
      const caption = old && old.type === "code" ? old.caption : undefined;
      return { type, text, language, ...(caption !== undefined ? { caption } : {}) };
    }

    case "image": {
      if (old && old.type === "image") {
        return {
          type,
          url: old.url,
          ...(old.alt !== undefined ? { alt: old.alt } : {}),
          ...(old.mime_type !== undefined ? { mime_type: old.mime_type } : {}),
          ...(old.caption !== undefined ? { caption: old.caption } : {}),
        };
      }
      return { type, url: text };
    }

    case "page_ref": {
      if (old && old.type === "page_ref") {
        return {
          type,
          page_id: old.page_id,
          title: text || old.title,
          ...(old.icon !== undefined ? { icon: old.icon } : {}),
        };
      }
      return { type, page_id: "", title: text || "Untitled" };
    }

    case "database":
      return { type, database_id: old && old.type === "database" ? old.database_id : "" };

    case "table": {
      if (old && old.type === "table") {
        return {
          type,
          column_count: old.column_count,
          has_header_row: old.has_header_row,
        };
      }
      return { type, column_count: 1, has_header_row: false };
    }

    case "table_row": {
      if (old && old.type === "table_row") {
        return { type, cells: old.cells };
      }
      return { type, cells: [rich_text] };
    }
  }
}

/** Body fragment for `createBlock` ({ type, content }). */
export function makeBlock(type: BlockType, text = ""): Record<string, unknown> {
  return { type, content: textToContent(type, text) };
}
