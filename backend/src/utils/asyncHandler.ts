import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrap an async route handler so rejected promises (and sync throws inside it,
 * like zod's `.parse()`) are forwarded to Express's error middleware.
 *
 * Express 4 does NOT auto-catch errors from async handlers — without this
 * wrapper a thrown ZodError (or any rejected promise) crashes the process.
 */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
