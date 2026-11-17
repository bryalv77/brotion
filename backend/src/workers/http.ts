import type { Context } from "hono";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors.js";
import { logger } from "../config/logger.js";
import type { AppEnv } from "./types.js";

type C = Context<AppEnv>;

/** Standard success envelope helpers (mirror utils/http.ts for Express). */
export const ok = <T>(c: C, data: T, status: 200 | 201 = 200) =>
  c.json({ data }, status);
export const created = <T>(c: C, data: T) => c.json({ data }, 201);
export const noContent = (c: C) => c.body(null, 204);

/** Map thrown errors to the standard API envelope. */
export function errorResponse(c: C, err: unknown) {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.flatten(),
        },
      },
      400,
    );
  }
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      err.status as 400,
    );
  }
  const errorId = crypto.randomUUID();
  logger.error(
    {
      err:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : err,
      errorId,
    },
    "Unhandled error",
  );
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
        errorId,
      },
    },
    500,
  );
}
