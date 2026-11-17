import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok } from "../http.js";
import { csrfGuard, requireAuth } from "../middleware.js";
import { getCurrentUser } from "../../modules/auth/auth.service.js";
import { adoptLocalSchema } from "../../modules/auth/adopt.schema.js";
import { adoptLocalData } from "../../modules/auth/adopt.service.js";

export const meRoutes = new Hono<AppEnv>();

meRoutes.get("/", requireAuth, async (c) => {
  const user = await getCurrentUser(c.get("user").id);
  return ok(c, { user });
});

// Guest → account merge. Mutating, so CSRF-guarded like every other POST.
meRoutes.post("/adopt-local", requireAuth, csrfGuard, async (c) => {
  const input = adoptLocalSchema.parse(await c.req.json());
  const result = await adoptLocalData(c.get("user").id, input);
  return ok(c, result);
});
