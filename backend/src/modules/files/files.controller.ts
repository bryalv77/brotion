import type { Request, Response } from "express";
import { stat } from "node:fs/promises";
import { created } from "../../utils/http.js";
import { env } from "../../config/env.js";
import { storeUpload, resolveStoragePath } from "./files.service.js";
import { badRequest, notFound } from "../../utils/errors.js";

/** POST /files (multipart/form-data: file, page_id?, block_id?) */
export async function uploadFileHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw badRequest("No file uploaded. Field `file` is required.");
  }
  const pageId =
    typeof req.body.page_id === "string" ? req.body.page_id : undefined;
  const blockId =
    typeof req.body.block_id === "string" ? req.body.block_id : undefined;

  const attachment = await storeUpload({
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    data: req.file.buffer,
    userId: req.user!.id,
    pageId,
    blockId,
  });
  created(res, { attachment });
}

/** GET /files/:key — serve a stored file's bytes. */
export async function getFileHandler(req: Request, res: Response): Promise<void> {
  const key = req.params.key;
  let path: string;
  try {
    path = resolveStoragePath(key);
  } catch {
    throw notFound("File not found.");
  }
  try {
    await stat(path);
    res.status(200).type(key).sendFile(path);
  } catch {
    throw notFound("File not found.");
  }
}

// Re-exported for reference by other modules (e.g. route config).
export const UPLOAD_LIMIT = env.MAX_UPLOAD_BYTES;
