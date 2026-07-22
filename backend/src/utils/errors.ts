import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

/**
 * Domain error type. Services throw these; the error middleware maps them to
 * the right HTTP status + envelope. Keeps controllers thin and status codes
 * centralized.
 */
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

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    errorId?: string;
  };
}

/**
 * Centralized error handler — the last middleware in the stack. Converts any
 * thrown error (ApiError, ZodError, or unknown) into the standard envelope.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const body: ErrorEnvelope = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof ApiError) {
    const body: ErrorEnvelope = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.status).json(body);
    return;
  }

  // Unknown error — never leak internals, attach a reference id.
  const errorId = randomUUID();
  logger.error({ err, errorId }, "Unhandled error");
  const body: ErrorEnvelope = {
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
      errorId,
    },
  };
  res.status(500).json(body);
}
