import { test, expect, type Page } from "@playwright/test";

/**
 * Sheet UI e2e (spec 013 acceptance criteria H + I).
 *
 * The slash menu's "Database" item creates a sheet on the current page; the
 * sheet renders below the editor; a formula column recomputes when its
 * inputs change.
 */

const DEMO_EMAIL = "demo@notion.local";
const DEMO_PASSWORD = "password123";

async function loginViaUi(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/app\/.+/, { timeout: 15_000 });
}

async function createFreshPage(page: Page, title: string): Promise<{ wsId: string; pageId: string }> {
  // Use the page's request context so cookies are shared.
  const api = page.context().request;
  const wsRes = await api.get("/api/v1/workspaces");
  const wsId = (await wsRes.json()).data.workspaces[0].id as string;
  const pageRes = await api.post(`/api/v1/workspaces/${wsId}/pages`, {
    data: { title },
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  expect(pageRes.status()).toBe(201);
  const pageId = (await pageRes.json()).data.page.id as string;
  return { wsId, pageId };
}

test.describe("sheets UI", () => {
  test("slash menu → Database creates a sheet that renders below the editor", async ({
    page,
  }) => {
    await loginViaUi(page);
    const { wsId, pageId } = await createFreshPage(page, "Sheet Test");

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "networkidle" });
    await expect(page.locator(".nc-editor .ProseMirror")).toBeVisible({ timeout: 10_000 });

    // Add a sheet via the slash menu.
    const editor = page.locator(".nc-editor .ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/");
    await expect(page.locator(".nc-slash-menu")).toBeVisible({ timeout: 5_000 });
    await page.locator(".nc-slash-menu").getByText("Sheet").first().click();

    // A sheet header (h2) should appear with the title "Untitled".
    await expect(
      page.getByRole("heading", { name: /Untitled/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("formula cell shows the computed result and an error for unknown property", async ({
    page,
  }) => {
    await loginViaUi(page);
    const { wsId, pageId } = await createFreshPage(page, "Formula Test");
    const api = page.context().request;

    // Create a sheet + columns via the API (deterministic).
    const dbRes = await api.post(`/api/v1/pages/${pageId}/databases`, {
      data: { title: "Math", icon: "📊" },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const dbId = (await dbRes.json()).data.database.id as string;
    const num = await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: { name: "N", type: "number" },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const numId = (await num.json()).data.property.id as string;
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: { name: "Bad", type: "formula", options: { formula: 'prop("Nope")' } },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: {
        name: "Doubled",
        type: "formula",
        options: { formula: 'prop("N") * 2' },
      },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const row = await api.post(`/api/v1/databases/${dbId}/rows`, {
      data: {},
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const rowId = (await row.json()).data.row.page_id as string;
    await api.patch(`/api/v1/rows/${rowId}/properties/${numId}`, {
      data: { value: 21 },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Math" })).toBeVisible({ timeout: 10_000 });

    // Find a cell that shows the value 42 (the Doubled formula).
    const cell42 = page.locator("table td").filter({ hasText: /^42$/ }).first();
    await expect(cell42).toBeVisible({ timeout: 10_000 });

    // And the "Bad" cell shows an error.
    const bad = page
      .locator("table td")
      .filter({ hasText: /Unknown property: "Nope"/ })
      .first();
    await expect(bad).toBeVisible({ timeout: 10_000 });
  });

  test("changing a price in row A live-updates the sum() on row B", async ({
    page,
  }) => {
    await loginViaUi(page);
    const { wsId, pageId } = await createFreshPage(page, "Live Update");
    const api = page.context().request;

    // Two rows, one Price column, one Total = sum(prop("Price")) column.
    const dbRes = await api.post(`/api/v1/pages/${pageId}/databases`, {
      data: { title: "Live", icon: "📊" },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const dbId = (await dbRes.json()).data.database.id as string;
    const price = await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: { name: "Price", type: "number" },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const priceId = (await price.json()).data.property.id as string;
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: {
        name: "Total",
        type: "formula",
        options: { formula: 'sum(prop("Price"))' },
      },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const rowA = (await (await api.post(`/api/v1/databases/${dbId}/rows`, {
      data: {},
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })).json()).data.row.page_id as string;
    const rowB = (await (await api.post(`/api/v1/databases/${dbId}/rows`, {
      data: {},
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })).json()).data.row.page_id as string;
    await api.patch(`/api/v1/rows/${rowA}/properties/${priceId}`, {
      data: { value: 10 },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    await api.patch(`/api/v1/rows/${rowB}/properties/${priceId}`, {
      data: { value: 20 },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Live" })).toBeVisible({ timeout: 10_000 });

    // Initial state: every row's Total cell shows 30 (10 + 20).
    const totalCells = page.locator("table td").filter({ hasText: /^30$/ });
    await expect(totalCells).toHaveCount(2, { timeout: 10_000 });

    // Now change row A's Price from 10 to 50 via the UI (typing into the
    // cell, blurring to commit). Both rows' Total cells should re-evaluate
    // to 70 (50 + 20) without a page reload.
    const priceInputs = page.locator('input[type="number"]');
    // First input is row A's Price.
    const rowAInput = priceInputs.nth(0);
    await rowAInput.fill("50");
    await rowAInput.blur();

    // Wait for both Total cells to show 70. If the refetch doesn't fire,
    // they'll stay at 30 and this assertion will time out.
    await expect(
      page.locator("table td").filter({ hasText: /^70$/ }),
    ).toHaveCount(2, { timeout: 10_000 });
  });

  test("no '+ Add a sheet' button on the page; /sheet creates one", async ({
    page,
  }) => {
    await loginViaUi(page);
    const { wsId, pageId } = await createFreshPage(page, "No Button");

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "networkidle" });
    await expect(page.locator(".nc-editor .ProseMirror")).toBeVisible({ timeout: 10_000 });

    // The "+ Add a sheet" button must not be on the page.
    await expect(page.getByText(/^\+ Add a sheet$/)).toHaveCount(0);
    await expect(page.getByText(/^\+ Add another sheet$/)).toHaveCount(0);

    // /sheet via the slash menu creates a sheet.
    const editor = page.locator(".nc-editor .ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/sheet");
    await expect(page.locator(".nc-slash-menu")).toBeVisible({ timeout: 5_000 });
    await page.locator(".nc-slash-menu").getByText("Sheet").first().click();

    await expect(
      page.getByRole("heading", { name: /Untitled/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
