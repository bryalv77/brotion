import type { Request, Response } from "express";
import { created } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";
import { importFile } from "./import.service.js";

/** POST /workspaces/:workspaceId/import */
export async function importHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw badRequest("No file uploaded. Field `file` is required.");
  }

  const parentId =
    typeof req.body.parent_id === "string" ? req.body.parent_id : undefined;

  const page = await importFile(
    req.params.workspaceId,
    req.user!.id,
    {
      originalname: req.file.originalname,
      buffer: req.file.buffer,
    },
    parentId,
  );

  created(res, { page });
}
