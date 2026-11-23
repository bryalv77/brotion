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
  test("visitor with no account lands in a local guest notebook", async ({ page }) => {
    await page.goto("/");
    // Straight into the app — no login wall. The seeded local notebook
    // opens on its Welcome page.
    await expect(page).toHaveURL(/\/page\//);
    await expect(page.getByText("Personal").first()).toBeVisible();
    await expect(page.getByText("Welcome", { exact: true }).first()).toBeVisible();
    // The login screen stays reachable as an optional upgrade (inside the
    // workspace switcher).
    await page.getByLabel("Switch workspace").click();
    await expect(page.getByRole("button", { name: "Sign in to sync" })).toBeVisible();
  });

  test("guest edits persist locally across reload (no backend session)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/page\//);

    // Create a page from the sidebar — entirely local (IndexedDB).
    await page.getByLabel("New page").first().click();
    await expect(page).toHaveURL(/\/page\/[^/]+/);
    await expect(page.getByText("Untitled").first()).toBeVisible();

    // Reload: still there, from the local store.
    await page.reload();
    await expect(page.getByText("Untitled").first()).toBeVisible();
  });

  test("signing in from guest mode uploads the local notebook", async ({ page }) => {
    // Fresh account for this test so adoption is observable and isolated.
    const email = `merge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
    const register = await page.request.post(`${API}/auth/register`, {
      data: { email, password: "password123" },
      headers: HEADERS,
    });
    expect(register.status()).toBe(201);

    // Guest first: open the app, get the seeded Personal notebook.
    await page.goto("/");
    await expect(page).toHaveURL(/\/page\//);

    // Sign in via the workspace switcher → login screen → credentials.
    await page.getByLabel("Switch workspace").click();
    await page.getByRole("button", { name: "Sign in to sync" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByText("Sign in", { exact: true }).click();
    await expect(page.getByText("Welcome back")).toHaveCount(0);

    // Landed back in the app, now server-backed, with the local Personal
    // workspace adopted into the account.
    await expect(page).toHaveURL(/\/page\//);
    await expect(page.getByRole("button", { name: "Switch workspace" })).toContainText("Personal");

    const wsRes = await page.request.get(`${API}/workspaces`, { headers: HEADERS });
    const workspaces = (
      (await wsRes.json()) as { data: { workspaces: { name: string }[] } }
    ).data.workspaces;
    expect(workspaces.some((w) => w.name === "Personal")).toBe(true);
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
    await page.getByRole("button", { name: "Click here to start writing" }).click();
    const input = page.getByPlaceholder("Type something…").first();
    await expect(input).toBeVisible();

    const saved = page.waitForResponse(
      (r) => r.request().method() === "PATCH" && r.url().includes("/blocks/") && r.ok(),
    );
    await input.fill("Persisted from Playwright");
    await saved;
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
