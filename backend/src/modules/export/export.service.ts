import type { Page, Block } from "@prisma/client";

/**
 * Page export: Markdown + PDF.
 *
 * Markdown is pure TS (no deps). PDF uses Puppeteer to render styled HTML.
 */

// ── Markdown ─────────────────────────────────────────────────────────────────

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

// ── HTML (for PDF) ────────────────────────────────────────────────────────────

export function toHtml(page: Page, blocks: Block[]): string {
  const body = blocks.map(blockToHtml).join("\n");
  const title = page.title || "Untitled";
  const icon = page.icon ? `${page.icon} ` : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 48px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; }
  h2 { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; }
  h3 { font-size: 1.25em; font-weight: 600; margin-top: 1em; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 0.25em 0; }
  blockquote { border-left: 3px solid #e5e5e5; padding-left: 1em; color: #6b7280; font-style: italic; margin: 0.5em 0; }
  pre { background: #1f2937; color: #f9fafb; border-radius: 8px; padding: 12px 16px; font-family: 'SF Mono', Monaco, monospace; font-size: 14px; overflow-x: auto; }
  code { background: #f3f4f6; border-radius: 4px; padding: 2px 6px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.875em; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 1em 0; }
</style>
</head>
<body>
<h1>${icon}${escapeHtml(title)}</h1>
${body}
</body>
</html>`;
}

function blockToHtml(block: Block): string {
  const c = block.content as Record<string, unknown>;
  const richText = Array.isArray(c.rich_text) ? c.rich_text : [];
  const text = richTextToHtml(richText);

  switch (block.type) {
    case "heading1": return `<h1>${text}</h1>`;
    case "heading2": return `<h2>${text}</h2>`;
    case "heading3": return `<h3>${text}</h3>`;
    case "bulleted_list_item": return `<ul><li>${text}</li></ul>`;
    case "numbered_list_item": return `<ol><li>${text}</li></ol>`;
    case "todo":
      return `<ul><li style="list-style:none">${c.checked ? "☑" : "☐"} ${text}</li></ul>`;
    case "quote": return `<blockquote>${text}</blockquote>`;
    case "callout": return `<blockquote>${c.icon ?? "💡"} ${text}</blockquote>`;
    case "code":
      return `<pre><code>${escapeHtml(String(c.text ?? ""))}</code></pre>`;
    case "divider": return `<hr>`;
    default: return `<p>${text}</p>`;
  }
}

function richTextToHtml(runs: unknown[]): string {
  return runs
    .map((run) => {
      const r = run as Record<string, unknown>;
      let text = escapeHtml(String(r.text ?? ""));
      const marks = Array.isArray(r.marks) ? (r.marks as string[]) : [];
      if (marks.includes("bold")) text = `<strong>${text}</strong>`;
      if (marks.includes("italic")) text = `<em>${text}</em>`;
      if (marks.includes("code")) text = `<code>${text}</code>`;
      return text;
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export async function toPdf(page: Page, blocks: Block[]): Promise<Buffer> {
  const html = toHtml(page, blocks);
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({ headless: true });
  try {
    const pg = await browser.newPage();
    await pg.setContent(html, { waitUntil: "load" });
    const pdf = await pg.pdf({
      format: "A4",
      margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
