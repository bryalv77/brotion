/** Extract searchable plain text from a block's content JSON. */
export function extractText(content: unknown): string {
  if (typeof content !== "object" || content === null) return "";
  const c = content as Record<string, unknown>;
  if (typeof c.text === "string") return c.text; // code blocks
  if (Array.isArray(c.rich_text)) {
    return extractRichText(c.rich_text);
  }
  if (Array.isArray(c.cells)) {
    // table_row: one RichText[] per column.
    return (c.cells as unknown[])
      .map((cell) => (Array.isArray(cell) ? extractRichText(cell) : ""))
      .join(" ");
  }
  return "";
}

function extractRichText(runs: unknown[]): string {
  return runs
    .map((r) =>
      typeof r === "object" && r !== null && "text" in r
        ? String((r as Record<string, unknown>).text ?? "")
        : "",
    )
    .join(" ");
}
