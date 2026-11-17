import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created, noContent } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import {
  createBlockSchema,
  updateBlockSchema,
  reorderBlockSchema,
} from "../../modules/blocks/blocks.schema.js";
import {
  createBlock,
  listBlocks,
  updateBlock,
  deleteBlock,
  reorderBlock,
} from "../../modules/blocks/blocks.service.js";

/** Routes under `/pages/:pageId/blocks`. */
export const pageBlocksRoutes = new Hono<AppEnv>();

pageBlocksRoutes.get("/", requireAuth, async (c) => {
  const blocks = await listBlocks(c.req.param("pageId")!, c.get("user").id);
  return ok(c, { blocks });
});

pageBlocksRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const body = createBlockSchema.parse(await c.req.json());
  const block = await createBlock(
    c.req.param("pageId")!,
    c.get("user").id,
    body,
  );
  return created(c, { block });
});

pageBlocksRoutes.post("/reorder", requireAuth, csrfGuard, async (c) => {
  const body = reorderBlockSchema.parse(await c.req.json());
  const block = await reorderBlock(
    c.req.param("pageId")!,
    c.get("user").id,
    body,
  );
  return ok(c, { block });
});

/** Routes under `/blocks`. */
export const blocksRoutes = new Hono<AppEnv>();

blocksRoutes.patch("/:blockId", requireAuth, csrfGuard, async (c) => {
  const body = updateBlockSchema.parse(await c.req.json());
  const block = await updateBlock(
    c.req.param("blockId")!,
    c.get("user").id,
    body,
  );
  return ok(c, { block });
});

blocksRoutes.delete("/:blockId", requireAuth, csrfGuard, async (c) => {
  await deleteBlock(c.req.param("blockId")!, c.get("user").id);
  return noContent(c);
});
