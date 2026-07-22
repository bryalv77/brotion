/**
 * Fractional-index ordering for blocks.
 *
 * `order` is a Float; inserting between two neighbors is their midpoint. This
 * avoids re-writing every row on each reorder (an integer-rank approach would).
 * When the gap gets too small to midpoint safely, the caller renormalizes.
 */

/** Smallest meaningful gap before we renormalize the whole sibling list. */
export const MIN_GAP = 1e-6;

export interface Anchor {
  id: string;
  order: number;
}

/**
 * Compute a new `order` value given optional before/after anchors.
 *
 * Semantics (Notion-style):
 *   `after`  = the block the new one comes AFTER  (lower order)
 *   `before` = the block the new one comes BEFORE (higher order)
 *
 * - both null   → append after the last sibling (`lastOrder + 1`, or 1.0 if none)
 * - before only → place just before it: `before.order - 0.5`
 * - after only  → place just after it:  `after.order + 1.0`
 * - both        → midpoint of after and before; throws if `after.order >= before.order`
 *
 * `siblings` (ordered asc) is needed only for the both-null append case.
 */
export function computeOrder(
  before: Anchor | null,
  after: Anchor | null,
  siblings?: { order: number }[],
): number {
  if (before && after) {
    if (after.order >= before.order) {
      throw new Error("Invalid anchors: `after` must precede `before`.");
    }
    return (after.order + before.order) / 2;
  }
  if (before) return before.order - 0.5;
  if (after) return after.order + 1.0;

  // No anchors → append.
  const max = siblings && siblings.length ? siblings[siblings.length - 1].order : 0;
  return max + 1.0;
}

/** True if a midpoint between two anchors is too small to be safe. */
export function gapTooSmall(before: Anchor, after: Anchor): boolean {
  return Math.abs(before.order - after.order) < MIN_GAP;
}

/**
 * Renormalize a sibling list to evenly-spaced integer orders (1, 2, 3, …).
 * Used when midpoints get too cramped. Returns a map of blockId → new order.
 */
export function renormalize(ids: string[]): Map<string, number> {
  const out = new Map<string, number>();
  ids.forEach((id, i) => out.set(id, i + 1));
  return out;
}
