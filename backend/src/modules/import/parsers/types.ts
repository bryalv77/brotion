/**
 * Shared types for the import parsers.
 * Each parser converts a file buffer into an ordered list of block definitions
 * that the import service inserts into the database.
 */

export interface ParsedBlock {
  type: string;
  content: Record<string, unknown>;
  /** For table_row children — the parent block index in the array. */
  parentIndex?: number;
}

export interface ExtractedImage {
  buffer: Buffer;
  mimeType: string;
  /** Suggested file name (parser may derive from alt text or use a generic one). */
  fileName: string;
  /** Index in the blocks array where this image block should be inserted. */
  blockIndex: number;
}

export interface ParsedDocument {
  title: string;
  blocks: ParsedBlock[];
  /** Images extracted from the source document, in order of appearance. */
  images: ExtractedImage[];
}
