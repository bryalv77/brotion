import type { Response } from "express";

/**
 * Standard API envelope helpers. Every controller MUST use these so responses
 * match the shape defined in /shared/contracts.md:
 *   success: { data: ... }
 *   error:   { error: { code, message, details?, errorId? } }
 */

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ data });
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
