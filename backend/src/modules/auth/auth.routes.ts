import { Router } from "express";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
} from "./auth.controller.js";

export const authRouter = Router();

// All mutating auth endpoints require the CSRF header (defense-in-depth with
// SameSite=Lax cookies). refresh is POST too, so it's guarded as well.
// asyncHandler ensures thrown errors (incl. zod validation) reach the error
// middleware instead of crashing the process.
authRouter.post("/register", csrfGuard, asyncHandler(registerHandler));
authRouter.post("/login", csrfGuard, asyncHandler(loginHandler));
authRouter.post("/logout", csrfGuard, asyncHandler(logoutHandler));
authRouter.post("/refresh", csrfGuard, asyncHandler(refreshHandler));
