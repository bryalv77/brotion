import { getPrisma } from "../../prisma/client.js";
import { env } from "../../config/env.js";
import { toAttachmentDTO } from "./files.dto.js";
import { badRequest, tooLarge } from "../../utils/errors.js";

/** Minimal object-store surface: Cloudflare R2 in production, a disk folder in Node. */
export interface FileBucket {
  put(key: string, bytes: Uint8Array): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
}

const ALLOWED = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
  [".md", "text/markdown"],
  [".markdown", "text/markdown"],
  [".txt", "text/plain"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".xls", "application/vnd.ms-excel"],
]);

/** Storage keys are a uuid plus a safe extension; anything else could be a path traversal. */
export const isValidStorageKey = (key: string): boolean => /^[A-Za-z0-9-]+\.[A-Za-z0-9]+$/.test(key);

const extOf = (name: string): string => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
};

/** MIME type for a stored file, derived from its key's extension. */
export const mimeForKey = (key: string): string =>
  ALLOWED.get(extOf(key)) ?? "application/octet-stream";

export interface UploadInput {
  file: File;
  userId: string;
  origin: string;
  pageId?: string;
  blockId?: string;
}

/** Validate + persist an upload, returning the attachment DTO. */
export async function storeUpload(bucket: FileBucket, input: UploadInput) {
  const { file } = input;
  if (file.size > env.MAX_UPLOAD_BYTES) throw tooLarge();
  const ext = extOf(file.name);
  if (!ALLOWED.has(ext)) {
    throw badRequest("Unsupported file type.", { code: "UNSUPPORTED_TYPE" });
  }

  const storageKey = `${crypto.randomUUID()}${ext}`;
  await bucket.put(storageKey, new Uint8Array(await file.arrayBuffer()));

  const attachment = await getPrisma().attachment.create({
    data: {
      user_id: input.userId,
      page_id: input.pageId ?? null,
      block_id: input.blockId ?? null,
      file_name: file.name,
      mime_type: file.type || ALLOWED.get(ext)!,
      size_bytes: file.size,
      storage_key: storageKey,
      // Absolute: the web app and the API live on different origins.
      url: `${input.origin}/api/v1/files/${storageKey}`,
    },
  });
  return toAttachmentDTO(attachment);
}
