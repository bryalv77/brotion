import type { Prisma, BlockType } from "@prisma/client";
import { extname } from "node:path";
import { getPrisma } from "../../prisma/client.js";
import { assertWorkspaceMember } from "../auth/permissions.service.js";
import { refreshPageContentText } from "../pages/pages.service.js";
import { toPageDTO } from "../pages/pages.dto.js";
import { storeUpload } from "../files/files.service.js";
import { parseMarkdown } from "./parsers/markdown.js";
import { parseText } from "./parsers/text.js";
import { parseDocx } from "./parsers/docx.js";
import { parsePdf } from "./parsers/pdf.js";
import { parseSpreadsheet } from "./parsers/spreadsheet.js";
import type { ParsedDocument } from "./parsers/types.js";
import { badRequest } from "../../utils/errors.js";

/**
 * Import orchestrator: detect file format → parse → create page + blocks
 * in a single transaction.
 */

const SUPPORTED_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".docx", ".pdf", ".xlsx", ".xls"]);

export async function importFile(
  workspaceId: string,
  userId: string,
  file: { originalname: string; buffer: Buffer },
  parentId?: string,
) {
  await assertWorkspaceMember(workspaceId, userId);

  const ext = extname(file.originalname).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw badRequest(
      `Unsupported file type "${ext}". Supported: .md, .txt, .docx, .pdf, .xlsx`,
    );
  }

  // Parse the file into a ParsedDocument.
  const doc = await parseByFormat(ext, file.buffer);

  // Pre-allocate attachment URLs for any extracted images so we can write
  // them into the image blocks during the initial insert (avoids a 2nd pass).
  const imageUrls = new Map<number, string>();
  for (let i = 0; i < doc.images.length; i++) {
    try {
      const att = await storeUpload({
        fileName: doc.images[i].fileName,
        mimeType: doc.images[i].mimeType,
        sizeBytes: doc.images[i].buffer.length,
        data: doc.images[i].buffer,
        userId,
        pageId: undefined, // patched after the page exists
        blockId: undefined,
      });
      imageUrls.set(i, att.url);
    } catch {
      // Skip images that fail validation (e.g. unsupported mime); the image
      // block will be created with an empty src so the user sees a gap.
    }
  }

  // Rewrite image blocks to point at the freshly stored attachments.
  for (const block of doc.blocks) {
    if (block.type === "image") {
      const content = block.content as { url?: string };
      const match = typeof content.url === "string" && content.url.startsWith("__pending_image__:")
        ? Number(content.url.split(":")[1])
        : -1;
      if (match >= 0 && imageUrls.has(match)) {
        content.url = imageUrls.get(match)!;
      }
    }
  }

  // Create the page + all blocks in one transaction.
  const page = await getPrisma().$transaction(async (tx) => {
    const newPage = await tx.page.create({
      data: {
        workspace_id: workspaceId,
        parent_id: parentId ?? null,
        title: doc.title || "Imported page",
        created_by: userId,
        last_updated_by: userId,
      },
    });

    // Insert blocks with incrementing order values.
    // For table_row blocks, resolve parent_block_id from the table parent.
    const idMap = new Map<number, string>(); // parentIndex → block id

    for (let i = 0; i < doc.blocks.length; i++) {
      const block = doc.blocks[i];
      let parentBlockId: string | null = null;

      if (block.parentIndex !== undefined && block.parentIndex >= 0) {
        parentBlockId = idMap.get(block.parentIndex) ?? null;
      }

      const created = await tx.block.create({
        data: {
          page_id: newPage.id,
          parent_block_id: parentBlockId,
          type: block.type as BlockType,
          content: block.content as Prisma.InputJsonValue,
          order: i + 1.0,
          created_by: userId,
        },
      });

      idMap.set(i, created.id);
    }

    return newPage;
  });

  // Update content_text for search (outside transaction to keep it light).
  await refreshPageContentText(page.id);

  // Also store the original file as an attachment on the page so the user
  // can download the source alongside the converted blocks.
  try {
    await storeUpload({
      fileName: file.originalname,
      mimeType: "",
      sizeBytes: file.buffer.length,
      data: file.buffer,
      userId,
      pageId: page.id,
    });
  } catch {
    // Non-fatal: the import succeeded, the attachment is a bonus.
  }

  return toPageDTO(page);
}

async function parseByFormat(ext: string, buffer: Buffer): Promise<ParsedDocument> {
  switch (ext) {
    case ".md":
    case ".markdown":
      return parseMarkdown(buffer.toString("utf-8"));
    case ".txt":
      return parseText(buffer.toString("utf-8"));
    case ".docx":
      return parseDocx(buffer);
    case ".pdf":
      return parsePdf(buffer);
    case ".xlsx":
    case ".xls":
      return parseSpreadsheet(buffer);
    default:
      throw badRequest(`Unsupported file type: ${ext}`);
  }
}
