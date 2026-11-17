import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Backend-only E2E suite. The API specs from the archived Vite app are still
 * valid: they exercise the Hono/Prisma backend through HTTP and need no
 * browser UI. Run with:
 *
 *   DATABASE_URL=postgresql://notion:notion@127.0.0.1:5433/notion_clone \
 *     yarn workspace frontend test:api
 */
const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";

export default defineConfig({
  testDir: "./legacy-web/tests/e2e",
  testMatch:
    /(auth|adopt|pages|collab|databases|sheets|import|export|templates|workspaces|images)\.spec\.ts$/,
  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  timeout: 60_000,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BACKEND,
  },
  webServer: {
    command: "yarn e2e:server:backend",
    url: `${BACKEND}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
