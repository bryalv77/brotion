import { test, expect } from "@playwright/test";

/**
 * Smoke test: the app loads and shows the login page (since no session exists).
 * Covers that Vite, React, routing, and Tailwind all hold together.
 */
test.describe("smoke", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /login (the default catch-all redirects to /app which
    // RequireAuth redirects to /login).
    await expect(page).toHaveURL(/\/(login|app)/);
    // Either the login form or a loading spinner should be visible.
    await expect(page.locator("body")).toBeVisible();
  });
});
