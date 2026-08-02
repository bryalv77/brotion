import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright config for the notion-clone frontend.
 *
 * e2e suites hit the full stack: the frontend (Vite, :5173) and the backend
 * (:4000) are started as two separate webServers. UI tests load the app at
 * baseURL; API tests (auth, etc.) call /api/v1 which Vite proxies to the backend
 * (same-origin, so cookies and CORS behave like real browser usage).
 *
 * The backend is gated on its health endpoint because it (Prisma + Express)
 * boots slower than Vite; without that gate API tests 500 through the proxy.
 *
 * Speed tuning (see AGENTS.md / e2e perf):
 * - `NODE_ENV=test` flips the backend to fast argon2 params (1024 KiB / t=1)
 *   so hundreds of register/login calls don't each pay 50–150ms.
 * - Backend runs as a prebuilt `node dist/server.js` instead of `tsx watch`,
 *   cutting cold-boot time roughly in half.
 * - 4 workers run in parallel; the fast argon2 keeps memory pressure low
 *   (~4 MiB × 4 = 16 MiB vs the previous 19 MiB × 1).
 * - globalSetup truncates the test DB and exports the demo user's cookies to
 *   `.auth/demo.json`, so UI tests skip the per-test login flow.
 */
const FRONTEND = "http://localhost:5173";
const BACKEND_HEALTH = "http://localhost:4000/api/v1/health";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 4,
  timeout: 60_000, // generous per-test timeout (was kept for legacy flaky tests)
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || FRONTEND,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Skip starting servers if both are already running locally (faster iteration).
  webServer: servers(),
});

function servers() {
  if (process.env.E2E_BASE_URL) return undefined;
  return [
    {
      command: "yarn e2e:server:backend",
      url: BACKEND_HEALTH,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      stdout: "pipe" as const,
      stderr: "pipe" as const,
    },
    {
      command: "yarn e2e:server:frontend",
      url: FRONTEND,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe" as const,
      stderr: "pipe" as const,
    },
  ];
}
