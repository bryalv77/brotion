import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * E2E for the unified Expo web app (react-native-web rendered in Chromium).
 * Covers the flows that replaced the old Vite/TipTap UI tests.
 */
const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
const WEB = process.env.E2E_WEB_URL || "http://127.0.0.1:8092";

export default defineConfig({
  testDir: "./tests/e2e-web",
  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  fullyParallel: false,
  retries: 0,
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: WEB,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm e2e:server:backend",
      url: `${BACKEND}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm e2e:server:frontend",
      url: WEB,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
