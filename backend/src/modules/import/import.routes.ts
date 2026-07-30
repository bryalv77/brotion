import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { env } from "../../config/env.js";
import { errorHandler } from "../../utils/errors.js";
import { ApiError } from "../../utils/errors.js";
import { importHandler } from "./import.controller.js";

export const importRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
});

function uploadImportFile() {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single("file")(
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

importRouter.post(
  "/",
  requireAuth,
  csrfGuard,
  uploadImportFile(),
  asyncHandler(importHandler),
);
