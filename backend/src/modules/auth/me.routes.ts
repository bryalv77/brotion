import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { meHandler } from "./auth.controller.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, asyncHandler(meHandler));
