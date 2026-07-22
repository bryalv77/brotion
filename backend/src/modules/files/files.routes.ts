import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { env } from "../../config/env.js";
import { uploadFileHandler, getFileHandler } from "./files.controller.js";
import { errorHandler } from "../../utils/errors.js";
import { ApiError } from "../../utils/errors.js";

export const filesRouter = Router();

// Memory storage → controller writes to disk only after validation. Size cap
// enforced here so large uploads are rejected before they fill memory/disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
});

/**
 * Wrap multer.single so its errors (e.g. LIMIT_FILE_SIZE) become our standard
 * API error envelope. We cast req/res through `unknown` at the multer boundary
 * to dodge a known @types/multer ↔ @types/express type duplication; the runtime
 * is unaffected (multer just needs Express-like request/response objects).
 */
function uploadSingle(field: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(field)(
      req as unknown as Parameters<ReturnType<typeof upload.single>>[0],
      res as unknown as Parameters<ReturnType<typeof upload.single>>[1],
      (err: unknown) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          errorHandler(new ApiError(413, "TOO_LARGE", "File is too large."), req, res, next);
          return;
        }
        if (err) {
          errorHandler(err, req, res, next);
          return;
        }
        next();
      },
    );
  };
}

// Upload requires auth + CSRF. Serving is public (img tags can't send headers).
filesRouter.post("/", requireAuth, csrfGuard, uploadSingle("file"), asyncHandler(uploadFileHandler));
filesRouter.get("/:key", asyncHandler(getFileHandler));
