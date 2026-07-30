import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ExtractedImage, ParsedDocument, ParsedBlock } from "./types.js";

/**
 * Parse a .docx file buffer into blocks.
 * Uses `mammoth` to convert DOCX → HTML, then `cheerio` to walk the HTML
 * into our block model. Images are captured separately so the import service
 * can store them as attachments and substitute their URLs into image blocks.
 */
export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import("mammoth");
  const images: ExtractedImage[] = [];
  let imgCounter = 0;

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const dataUri = await image.read("base64");
        const buf = Buffer.from(dataUri, "base64");
        const ext = extFromMime(image.contentType);
        const fileName = `image-${++imgCounter}${ext}`;
        images.push({
          buffer: buf,
          mimeType: image.contentType,
          fileName,
          blockIndex: -1, // patched in after htmlToBlocks below
        });
        // Sentinel src; htmlToBlocks converts this into a proper image block
        // pointing at extractedImages[images.length - 1].
        return { src: `__pending_image__:${images.length - 1}` };
      }),
    },
  );

  const { document, imageBlocks } = htmlToBlocks(result.value, images.length);

  // Patch blockIndex on each extracted image to match its image block position.
  for (const { imageIndex, blockIndex } of imageBlocks) {
    if (images[imageIndex]) images[imageIndex].blockIndex = blockIndex;
  }

  return { ...document, images };
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("svg")) return ".svg";
  return ".bin";
}

/**
 * Convert an HTML string into blocks using cheerio.
 * Inline marks (bold, italic, underline, code) are extracted from <strong>,
 * <em>, <u>, and <code> wrappers so they survive the conversion.
 */
export function htmlToBlocks(
  html: string,
  expectedImageCount = 0,
): { document: ParsedDocument; imageBlocks: Array<{ imageIndex: number; blockIndex: number }> } {
  const $ = cheerio.load(html);
  const blocks: ParsedBlock[] = [];
  const imageBlocks: Array<{ imageIndex: number; blockIndex: number }> = [];
  let title = "";

  function pushBlock(b: ParsedBlock) {
    blocks.push(b);
  }

  function runsFromElement($el: cheerio.Cheerio<AnyNode>) {
    return extractInline($, $el, []);
  }

  $("body")
    .children()
    .each((_, el) => {
      const $el = $(el);
      const tag = (el.tagName || "").toLowerCase();
      const text = $el.text().trim();

      // Image-only paragraphs: <p><img src="__pending_image__:N"></p>
      const imgSrc = $el.find("img").attr("src");
      if (imgSrc && imgSrc.startsWith("__pending_image__:")) {
        const imageIndex = Number(imgSrc.split(":")[1]);
        pushBlock({
          type: "image",
          content: { type: "image", url: imgSrc, alt: $el.find("img").attr("alt") || undefined },
        });
        imageBlocks.push({ imageIndex, blockIndex: blocks.length - 1 });
        return;
      }
      // <p> with mixed inline content (text + an image). Keep both.
      if (tag === "p" && imgSrc && text) {
        // Promote the image to its own block AFTER the paragraph text.
        pushBlock({
          type: "paragraph",
          content: { type: "paragraph", rich_text: runsFromElement($el.clone().find("img").remove().end()) },
        });
        const imageIndex = Number(imgSrc.split(":")[1]);
        pushBlock({
          type: "image",
          content: { type: "image", url: imgSrc, alt: $el.find("img").attr("alt") || undefined },
        });
        imageBlocks.push({ imageIndex, blockIndex: blocks.length - 1 });
        return;
      }

      if (!text && tag !== "hr") return;

      switch (tag) {
        case "h1":
          if (!title) title = text.slice(0, 200);
          pushBlock({
            type: "heading1",
            content: { type: "heading1", rich_text: runsFromElement($el) },
          });
          break;
        case "h2":
          pushBlock({
            type: "heading2",
            content: { type: "heading2", rich_text: runsFromElement($el) },
          });
          break;
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          pushBlock({
            type: "heading3",
            content: { type: "heading3", rich_text: runsFromElement($el) },
          });
          break;
        case "ul":
          $el.find("li").each((_, li) => {
            const $li = $(li);
            if ($li.text().trim()) {
              pushBlock({
                type: "bulleted_list_item",
                content: { type: "bulleted_list_item", rich_text: extractInline($, $li, []) },
              });
            }
          });
          break;
        case "ol":
          $el.find("li").each((_, li) => {
            const $li = $(li);
            if ($li.text().trim()) {
              pushBlock({
                type: "numbered_list_item",
                content: { type: "numbered_list_item", rich_text: extractInline($, $li, []) },
              });
            }
          });
          break;
        case "blockquote":
          pushBlock({
            type: "quote",
            content: { type: "quote", rich_text: extractInline($, $el, []) },
          });
          break;
        case "pre":
          pushBlock({
            type: "code",
            content: { type: "code", text: $el.text(), language: "plaintext" },
          });
          break;
        case "hr":
          pushBlock({ type: "divider", content: { type: "divider" } });
          break;
        case "table":
          parseHtmlTable($, $el, blocks);
          break;
        default:
          if (text) {
            pushBlock({
              type: "paragraph",
              content: { type: "paragraph", rich_text: runsFromElement($el) },
            });
          }
          break;
      }
    });

  if (!title && blocks.length > 0) {
    const first = blocks[0].content.rich_text as Array<{ text: string }> | undefined;
    title = first?.map((r) => r.text).join("").slice(0, 100) || "Imported document";
  }

  return {
    document: { title: title || "Imported document", blocks, images: [] },
    imageBlocks,
  };
  void expectedImageCount;
}

/**
 * Walk an element's children, building rich_text runs and tracking active
 * inline marks from <strong>, <em>, <u>, <code>, <s>.
 */
function extractInline(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<AnyNode>,
  marks: string[],
): Array<{ kind: "text"; text: string; marks?: string[] }> {
  const runs: Array<{ kind: "text"; text: string; marks?: string[] }> = [];
  const push = (text: string) => {
    if (!text) return;
    runs.push(marks.length > 0 ? { kind: "text", text, marks: [...marks] } : { kind: "text", text });
  };
  $el.contents().each((_, node) => {
    if (node.type === "text") {
      push($(node).text());
      return;
    }
    if (node.type !== "tag") return;
    const tag = (node.tagName || "").toLowerCase();
    if (tag === "br") {
      push("\n");
      return;
    }
    if (tag === "img") {
      // Skip inline images inside paragraph text — they're already promoted
      // to their own image blocks by the caller in htmlToBlocks.
      return;
    }
    const newMarks = [...marks];
    if (tag === "strong" || tag === "b") newMarks.push("bold");
    else if (tag === "em" || tag === "i") newMarks.push("italic");
    else if (tag === "u") newMarks.push("underline");
    else if (tag === "code") newMarks.push("code");
    else if (tag === "s" || tag === "strike" || tag === "del") newMarks.push("strike");
    const inner = extractInline($, $(node), newMarks);
    runs.push(...inner);
  });
  return runs;
}

/** Parse an HTML table element into table + table_row blocks. */
function parseHtmlTable(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<AnyNode>,
  blocks: ParsedBlock[],
): void {
  const rows: string[][] = [];
  let hasHeader = false;
  let colCount = 0;

  $table.find("tr").each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find("th, td")
      .each((__, cell) => {
        cells.push($(cell).text().trim());
        if ($(cell).is("th")) hasHeader = true;
      });
    if (cells.length > 0) {
      colCount = Math.max(colCount, cells.length);
      rows.push(cells);
    }
  });

  if (rows.length === 0) return;

  const tableIdx = blocks.length;
  blocks.push({
    type: "table",
    content: { type: "table", column_count: colCount, has_header_row: hasHeader },
  });

  for (const row of rows) {
    blocks.push({
      type: "table_row",
      content: {
        type: "table_row",
        cells: row.map((cell) => [{ kind: "text", text: cell }]),
      },
      parentIndex: tableIdx,
    });
  }
}
