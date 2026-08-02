import { test, expect } from "@playwright/test";

/**
 * Task 8 QA e2e: document title, responsive sidebar, ARIA labels.
 * The first two tests target unauthenticated pages and need no login.
 * The authed tests use the demo storageState produced by globalSetup.
 */

test.describe("QA: accessibility & responsive (unauth)", () => {
  test("register page has accessible form inputs", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    // Email and password inputs should be present and focusable.
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Submit button should have text (accessible name).
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("login page has accessible labels", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe("QA: accessibility & responsive (authed)", () => {
  test.use({ storageState: ".auth/demo.json" });

  test("document title updates on page view", async ({ page }) => {
    await page.goto("/app/demo-workspace/demo-welcome-page", { waitUntil: "domcontentloaded" });
    // After opening the Welcome page, the document title should include it.
    await expect(page).toHaveTitle(/Welcome/i, { timeout: 15_000 });
  });

  test("hamburger appears on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    // Hamburger should be visible on mobile.
    await expect(page.getByLabel("Open sidebar").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
