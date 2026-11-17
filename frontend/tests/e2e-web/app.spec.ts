import { test, expect, type Page } from "@playwright/test";

/**
 * E2E for the unified Expo web app (react-native-web rendered in Chromium).
 * These replace the archived Vite/TipTap UI specs.
 */

const API = "http://127.0.0.1:4000/api/v1";
const HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

async function signInAsDemo(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@notion.local");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByText("Sign in", { exact: true }).click();
  await expect(page.getByText("Welcome back")).toHaveCount(0);
}

async function makePage(page: Page, title: string): Promise<string> {
  const res = await page.request.post(`${API}/workspaces/demo-workspace/pages`, {
    data: { title },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.page.id as string;
}

test.describe("Expo web app", () => {
  test("unauthenticated visitor is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
  });

  test("demo user signs in and sees the workspace shell", async ({ page }) => {
    await signInAsDemo(page);
    await expect(page).toHaveURL(/\/page\/demo-welcome-page/);
    await expect(page.getByText("My Workspace")).toBeVisible();
    await expect(page.getByText("Welcome", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Trash")).toBeVisible();
    await expect(page.getByText("Search")).toBeVisible();
  });

  test("block editor persists typed text across reload", async ({ page }) => {
    await signInAsDemo(page);
    const pageId = await makePage(page, "E2E editor page");
    await page.goto(`/page/${pageId}`);

    await expect(page.getByText("E2E editor page")).toBeVisible();
    await page.getByRole("button", { name: "+ Add a block" }).click();
    // Wait for the optimistic temp block to be replaced by the API row.
    await page.waitForTimeout(1200);
    const input = page.getByPlaceholder("Type something…").first();
    await input.fill("Persisted from Playwright");

    // The editor debounces its PATCH by 600ms; reload after the text lands.
    await expect(input).toHaveValue("Persisted from Playwright");
    await page.waitForTimeout(1200);
    await page.reload();
    await expect(page.getByPlaceholder("Type something…").first()).toHaveValue(
      "Persisted from Playwright",
    );
  });

  test("creating a page from the sidebar navigates to the new page", async ({ page }) => {
    await signInAsDemo(page);
    await page.getByLabel("New page").first().click();
    await expect(page).toHaveURL(/\/page\/[^/]+/);
    await expect(page.getByText("Untitled")).toBeVisible();
  });

  test("quick search opens and finds the welcome page", async ({ page }) => {
    await signInAsDemo(page);
    await page.getByLabel("Search pages").click();
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("Welcome");
    await expect(page.getByText("Welcome", { exact: true }).first()).toBeVisible();
  });

  test("trash screen opens from the sidebar", async ({ page }) => {
    await signInAsDemo(page);
    await page.getByText("Trash").click();
    await expect(page).toHaveURL(/\/trash/);
    await expect(page.getByText("Trash", { exact: true }).first()).toBeVisible();
  });
});
