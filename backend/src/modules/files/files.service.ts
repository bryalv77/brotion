import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { getPrisma } from "../../prisma/client.js";
import { env } from "../../config/env.js";
import { toAttachmentDTO } from "./files.dto.js";
import { badRequest } from "../../utils/errors.js";

/**
 * File uploads. v1 stores to local disk under `backend/storage/` using an
 * opaque `storage_key` (uuid + safe extension) so the storage backend can be
 * swapped (e.g. S3) without touching callers.
 */

const ALLOWED = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
]);

const STORAGE_DIR = join(process.cwd(), "storage");

export interface UploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer | Readable;
  userId: string;
  pageId?: string;
  blockId?: string;
}

/** Validate + persist an upload, returning the attachment DTO. */
export async function storeUpload(input: UploadInput) {
  if (input.sizeBytes > env.MAX_UPLOAD_BYTES) {
    throw badRequest("File is too large.", {
      code: "TOO_LARGE",
      maxBytes: env.MAX_UPLOAD_BYTES,
    });
  }
  const ext = extname(input.fileName).toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw badRequest("Unsupported file type.", { code: "UNSUPPORTED_TYPE" });
  }

  await mkdir(STORAGE_DIR, { recursive: true });
  const storageKey = `${randomUUID()}${ext}`;
  const filePath = join(STORAGE_DIR, storageKey);

  if (Buffer.isBuffer(input.data)) {
    await pipeline(Readable.from(input.data), createWriteStream(filePath));
  } else {
    await pipeline(input.data, createWriteStream(filePath));
  }

  const attachment = await getPrisma().attachment.create({
    data: {
      user_id: input.userId,
      page_id: input.pageId ?? null,
      block_id: input.blockId ?? null,
      file_name: input.fileName,
      mime_type: input.mimeType || ALLOWED.get(ext) || "application/octet-stream",
      size_bytes: input.sizeBytes,
      storage_key: storageKey,
      url: `/api/v1/files/${storageKey}`,
    },
  });
  return toAttachmentDTO(attachment);
}

/** Resolve a storage key to an absolute file path (for serving). */
export function resolveStoragePath(storageKey: string): string {
  // Reject path traversal: only allow a bare filename (no slashes/..).
  if (!/^[A-Za-z0-9-]+\.[A-Za-z0-9]+$/.test(storageKey)) {
    throw badRequest("Invalid file key.");
  }
  return join(STORAGE_DIR, storageKey);
}
