import { test, expect, type Page } from "@playwright/test";

/**
 * Task 7 UI e2e: page header (title edit, icon, cover).
 */

const DEMO_EMAIL = "demo@notion.local";
const DEMO_PASSWORD = "password123";

async function loginAndOpenWelcomePage(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/app\/.+/, { timeout: 15_000 });
  await page.locator("aside").getByText("Welcome").first().click();
  await expect(page).toHaveURL(/\/app\/.+\/.+/, { timeout: 10_000 });
}

test.describe("page header", () => {
  test("title is visible and editable", async ({ page }) => {
    await loginAndOpenWelcomePage(page);
    // The title should be in a contenteditable div showing "Welcome".
    const title = page.locator('[contenteditable="true"]').first();
    await expect(title).toContainText("Welcome", { timeout: 10_000 });
  });

  test("add icon button appears on hover", async ({ page }) => {
    await loginAndOpenWelcomePage(page);
    // Hover over the header area to reveal "Add icon".
    const header = page.locator(".mb-8").first();
    await header.hover();
    // Either an icon button or "Add icon" should become visible.
    await expect(
      page.getByText("Icon").or(page.locator("text=😀")),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("add cover button appears on hover", async ({ page }) => {
    await loginAndOpenWelcomePage(page);
    const header = page.locator(".mb-8").first();
    await header.hover();
    await expect(page.getByText("Add cover")).toBeVisible({ timeout: 5_000 });
  });
});
