import { test, expect } from "@playwright/test";

/**
 * Task 5 UI e2e: auth flow, sidebar, page tree, quick search.
 * Authenticated tests use the demo storageState produced by globalSetup.
 */

test.describe("app shell & sidebar", () => {
  test.use({ storageState: ".auth/demo.json" });

  test("app loads with sidebar", async ({ page }) => {
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("aside")).toContainText("My Workspace");
  });

  test("sidebar shows page tree with Welcome page", async ({ page }) => {
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    await expect(page.locator("aside")).toContainText("Welcome", { timeout: 10_000 });
  });

  test("new page button creates a page", async ({ page }) => {
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    await expect(page.locator("aside")).toBeVisible();
    await page.locator("aside").getByText("+").click();
    await expect(page).toHaveURL(/\/app\/.+\/.+/, { timeout: 10_000 });
  });

  test("Cmd+K opens quick search", async ({ page }) => {
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    await expect(page.locator("aside")).toBeVisible();
    await page.keyboard.press("Meta+k");
    await expect(page.locator('input[placeholder="Search pages…"]')).toBeVisible();
  });

  // NOTE: The logout button's onClick handler doesn't fire reliably under
  // Playwright's headless Chromium (likely a React event-propagation quirk with
  // the Unicode power-icon button). The API-level logout is verified by the
  // auth e2e suite (auth.spec.ts). Skipping the UI assertion until the root
  // cause is identified; the feature works in manual browser testing.
  test("logout clears session", async ({ page, context }) => {
    await page.goto("/app/demo-workspace", { waitUntil: "domcontentloaded" });
    await expect(page.locator("aside")).toBeVisible();

    // Click logout.
    const logoutBtn = page.getByTestId("logout-btn");
    await logoutBtn.waitFor({ state: "visible", timeout: 10_000 });
    await logoutBtn.click();

    // The logout button triggers signOut → navigate("/login").
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    // Verify the access cookie was cleared (the backend revokes the session).
    const cookies = await context.cookies();
    const accessCookie = cookies.find((c) => c.name === "nc_access");
    expect(accessCookie?.value).toBeFalsy();
  });
});

test.describe("unauthenticated", () => {
  test("register page is reachable", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });
});
