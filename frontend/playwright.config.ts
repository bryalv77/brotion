import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the notion-clone frontend.
 *
 * e2e suites hit the full stack: the frontend (Vite, :5173) and the backend
 * (:4000) are started as two separate webServers. UI tests load the app at
 * baseURL; API tests (auth, etc.) call /api/v1 which Vite proxies to the backend
 * (same-origin, so cookies and CORS behave like real browser usage).
 *
 * The backend is gated on its health endpoint because it (Prisma + tsx) boots
 * slower than Vite; without that gate API tests 500 through the proxy.
 */
const FRONTEND = "http://localhost:5173";
const BACKEND_HEALTH = "http://localhost:4000/api/v1/health";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker: argon2 password hashing is memory-hard (19MiB), and running
  // many auth-heavy tests in parallel against one backend causes timeouts.
  workers: 1,
  timeout: 60_000, // generous per-test timeout (argon2 + session switches)
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
