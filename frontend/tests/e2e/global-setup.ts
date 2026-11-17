import { request } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../..");
const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";

/** Reset + reseed the demo data before the API suite runs. */
export default async function globalSetup(): Promise<void> {
  execFileSync("yarn", ["workspace", "backend", "prisma:reset"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });

  const ctx = await request.newContext({ baseURL: BACKEND });
  try {
    const res = await ctx.post("/api/v1/auth/login", {
      data: { email: "demo@notion.local", password: "password123" },
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (res.status() !== 200) {
      throw new Error(`Demo login failed: ${res.status()} ${await res.text()}`);
    }
  } finally {
    await ctx.dispose();
  }
}
