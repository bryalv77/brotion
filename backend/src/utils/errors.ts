import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

/** Domain error type. Services throw these; `toErrorResponse` maps them to an HTTP status + envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new ApiError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Not authenticated") =>
  new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden") =>
  new ApiError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found") =>
  new ApiError(404, "NOT_FOUND", message);
export const conflict = (message: string, details?: Record<string, unknown>) =>
  new ApiError(409, "CONFLICT", message, details);
export const unprocessableEntity = (
  message: string,
  details?: Record<string, unknown>,
) => new ApiError(422, "UNPROCESSABLE_ENTITY", message, details);

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    errorId?: string;
  };
}

export const tooLarge = () => new ApiError(413, "TOO_LARGE", "File is too large.");

/** Map any thrown error (ApiError, ZodError, or unknown) to an HTTP status and the standard envelope. */
export function toErrorResponse(err: unknown): { status: number; body: ErrorEnvelope } {
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.flatten(),
        },
      },
    };
  }
  if (err instanceof ApiError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
    };
  }
  // Unknown error — never leak internals, attach a reference id.
  const errorId = randomUUID();
  logger.error({ err, errorId }, "Unhandled error");
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Something went wrong", errorId } },
  };
}
