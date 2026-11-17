import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { createWorkspaceSchema } from "../../modules/workspaces/workspaces.schema.js";
import {
  listWorkspacesForUser,
  createWorkspace,
  getWorkspace,
} from "../../modules/workspaces/workspaces.service.js";

export const workspacesRoutes = new Hono<AppEnv>();

workspacesRoutes.get("/", requireAuth, async (c) => {
  const workspaces = await listWorkspacesForUser(c.get("user").id);
  return ok(c, { workspaces });
});

workspacesRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const body = createWorkspaceSchema.parse(await c.req.json());
  const workspace = await createWorkspace(c.get("user").id, body);
  return created(c, { workspace });
});

workspacesRoutes.get("/:workspaceId", requireAuth, async (c) => {
  const workspace = await getWorkspace(
    c.req.param("workspaceId")!,
    c.get("user").id,
  );
  return ok(c, { workspace });
});
