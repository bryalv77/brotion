import { test, expect } from "@playwright/test";

/**
 * Task 7 UI e2e: page header (title edit, icon, cover).
 * Uses the demo storageState produced by globalSetup.
 */

const WELCOME_URL = "/app/demo-workspace/demo-welcome-page";

test.describe("page header", () => {
  test.use({ storageState: ".auth/demo.json" });

  test("title is visible and editable", async ({ page }) => {
    await page.goto(WELCOME_URL, { waitUntil: "domcontentloaded" });
    // The title should be in a contenteditable div showing "Welcome".
    const title = page.locator('[contenteditable="true"]').first();
    await expect(title).toContainText("Welcome", { timeout: 10_000 });
  });

  test("add icon button appears on hover", async ({ page }) => {
    await page.goto(WELCOME_URL, { waitUntil: "domcontentloaded" });
    // Hover over the header area to reveal "Add icon".
    const header = page.locator(".mb-8").first();
    await header.hover();
    // Either an icon button or "Add icon" should become visible.
    await expect(
      page.getByText("Icon").or(page.locator("text=😀")),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("add cover button appears on hover", async ({ page }) => {
    await page.goto(WELCOME_URL, { waitUntil: "domcontentloaded" });
    const header = page.locator(".mb-8").first();
    await header.hover();
    await expect(page.getByText("Add cover")).toBeVisible({ timeout: 5_000 });
  });
});
