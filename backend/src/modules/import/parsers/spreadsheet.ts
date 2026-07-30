import * as XLSX from "xlsx";
import type { ParsedDocument } from "./types.js";

/**
 * Parse an Excel/spreadsheet file buffer into blocks.
 * Each sheet becomes a `table` block + N `table_row` children.
 */
export function parseSpreadsheet(buffer: Buffer): ParsedDocument {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const blocks: ParsedDocument["blocks"] = [];
  const title = `Imported: ${wb.SheetNames[0] || "spreadsheet"}`;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

    if (rows.length === 0) continue;

    const colCount = Math.max(...rows.map((r) => Array.isArray(r) ? r.length : 0));

    // Sheet heading (optional)
    if (wb.SheetNames.length > 1) {
      blocks.push({
        type: "heading2",
        content: {
          type: "heading2",
          rich_text: [{ kind: "text", text: sheetName }],
        },
      });
    }

    const tableIdx = blocks.length;
    blocks.push({
      type: "table",
      content: {
        type: "table",
        column_count: colCount,
        has_header_row: true,
      },
    });

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const cells = row.slice(0, colCount).map((cell) => [
        { kind: "text", text: cell == null ? "" : String(cell) },
      ]);
      blocks.push({
        type: "table_row",
        content: { type: "table_row", cells },
      });
      blocks[blocks.length - 1].parentIndex = tableIdx;
    }
  }

  return { title, blocks, images: [] };
}
