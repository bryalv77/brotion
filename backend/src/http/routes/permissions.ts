import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created, noContent } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { notFound } from "../../utils/errors.js";
import { createPermissionSchema } from "../../modules/permissions/permissions.schema.js";
import {
  listPermissions,
  createPermission,
  deletePermission,
  getPageByShareToken,
} from "../../modules/permissions/permissions.service.js";

/** Routes mounted at `/pages/:pageId/permissions`. */
export const pagePermissionsRoutes = new Hono<AppEnv>();
pagePermissionsRoutes.use("*", requireAuth);

pagePermissionsRoutes.get("/", async (c) => {
  const perms = await listPermissions(c.req.param("pageId")!, c.get("user").id);
  return ok(c, { permissions: perms });
});

pagePermissionsRoutes.post("/", csrfGuard, async (c) => {
  const input = createPermissionSchema.parse(await c.req.json());
  const perm = await createPermission(c.req.param("pageId")!, c.get("user").id, input);
  return created(c, { permission: perm });
});

pagePermissionsRoutes.delete("/:permissionId", csrfGuard, async (c) => {
  await deletePermission(
    c.req.param("pageId")!,
    c.req.param("permissionId")!,
    c.get("user").id,
  );
  return noContent(c);
});

/**
 * Public share route mounted at `/shared`; deliberately unauthenticated.
 */
export const sharedRoutes = new Hono<AppEnv>();

sharedRoutes.get("/:token", async (c) => {
  const result = await getPageByShareToken(c.req.param("token")!);
  if (!result) throw notFound("Shared page not found or link is invalid.");
  return ok(c, result);
});
