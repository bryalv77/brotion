import { ApiClientError } from "@/lib/api/client";

/**
 * Shared helpers for the local (guest) repository implementations. Errors
 * are thrown as `ApiClientError` with the same codes the server uses, so
 * every screen's existing error handling works unchanged.

 * `computeOrder` mirrors the server's fractional-index rule
 * (backend/src/modules/blocks/order.ts) — kept in sync deliberately so
 * adopted local data orders identically server-side.
 */

export function notFound(message: string): ApiClientError {
  return new ApiClientError(message, 404, "NOT_FOUND");
}

export function badRequest(
  message: string,
  code = "BAD_REQUEST",
): ApiClientError {
  return new ApiClientError(message, 400, code);
}

export function unprocessable(
  message: string,
  code: string,
): ApiClientError {
  return new ApiClientError(message, 422, code);
}

export interface Anchor {
  id: string;
  order: number;
}

/** Fractional-index order for a new block given optional before/after anchors. */
export function computeOrder(
  before: Anchor | null,
  after: Anchor | null,
  siblings: Array<{ order: number }>,
): number {
  if (before && after) {
    if (after.order >= before.order) {
      throw badRequest("Invalid before/after anchors.");
    }
    return (after.order + before.order) / 2;
  }
  if (before) return before.order - 0.5;
  if (after) return after.order + 1.0;
  const max = siblings.length ? siblings[siblings.length - 1].order : 0;
  return max + 1.0;
}

/** Extract plain searchable text from a block's content (mirrors the server). */
export function blockText(content: unknown): string {
  if (typeof content !== "object" || content === null) return "";
  const c = content as Record<string, unknown>;
  if (typeof c.text === "string") return c.text;
  if (Array.isArray(c.rich_text)) return richText(c.rich_text);
  if (Array.isArray(c.cells)) {
    return (c.cells as unknown[])
      .map((cell) => (Array.isArray(cell) ? richText(cell) : ""))
      .join(" ");
  }
  return "";
}

function richText(runs: unknown[]): string {
  return runs
    .map((r) =>
      typeof r === "object" && r !== null && "text" in r
        ? String((r as Record<string, unknown>).text ?? "")
        : "",
    )
    .join(" ");
}
