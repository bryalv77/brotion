import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok } from "../http.js";

/** Deliberately DB-free and unauthenticated — mirrors the Express health router. */
export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/", (c) => ok(c, { status: "ok" }));
