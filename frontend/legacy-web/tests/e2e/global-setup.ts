import { request, type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright globalSetup — runs once before any test.
 *
 * 1. Truncates the test DB and re-seeds the demo user (via `prisma:reset`).
 *    This gives every run a clean slate; the demo user is required by the UI
 *    tests that re-use it across specs.
 * 2. Logs in as `demo@notion.local` through the Vite proxy and exports the
 *    resulting cookies to `.auth/demo.json` so UI specs can `test.use({
 *    storageState })` instead of repeating the login form per test.
 *
 * webServer (backend + frontend) is started before this runs, so the HTTP
 * calls below are safe.
 */

const FRONTEND_URL = process.env.E2E_BASE_URL || "http://localhost:5173";
const DEMO_EMAIL = "demo@notion.local";
const DEMO_PASSWORD = "password123";
const AUTH_FILE = path.resolve(__dirname, "../../.auth/demo.json");

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Wipe & reseed. Use the workspace command from the repo root.
  // (Playwright sets CWD to the config dir, which is frontend/, so we cd up.)
  execSync("yarn workspace backend prisma:reset", {
    cwd: path.resolve(__dirname, "../.."),
    stdio: "inherit",
  });

  // Persist demo session cookies for UI specs.
  await mkdir(path.dirname(AUTH_FILE), { recursive: true });
  const ctx = await request.newContext({ baseURL: FRONTEND_URL });
  try {
    const res = await ctx.post("/api/v1/auth/login", {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (res.status() !== 200) {
      throw new Error(
        `Demo login failed: ${res.status()} ${await res.text()}`,
      );
    }
    await ctx.storageState({ path: AUTH_FILE });
  } finally {
    await ctx.dispose();
  }

  // Suppress unused-param warning while keeping the typed config available
  // for future per-project setup (e.g. multi-browser storage).
  void config;
}
