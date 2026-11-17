import type { Context } from "hono";
import { toErrorResponse } from "../utils/errors.js";
import type { AppEnv } from "./types.js";

type C = Context<AppEnv>;

export const ok = <T>(c: C, data: T, status: 200 | 201 = 200) =>
  c.json({ data }, status);
export const created = <T>(c: C, data: T) => c.json({ data }, 201);
/** Body for endpoints whose fields are all optional: a missing or malformed body means "no fields". */
export const optionalJson = (c: C): Promise<unknown> => c.req.json().catch(() => ({}));
export const noContent = (c: C) => c.body(null, 204);

/** Map thrown errors to the standard API envelope. */
export function errorResponse(c: C, err: unknown) {
  const { status, body } = toErrorResponse(err);
  return c.json(body, status as 400);
}
