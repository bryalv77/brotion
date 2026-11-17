import { test, expect } from "@playwright/test";
import { createFreshPageInFirstWorkspace, HEADERS } from "./helpers.js";

/**
 * Sheet UI e2e (spec 013 acceptance criteria H + I).
 *
 * The slash menu's "Database" item creates a sheet on the current page; the
 * sheet renders below the editor; a formula column recomputes when its
 * inputs change. Uses the demo storageState so tests skip the login form.
 */

test.describe("sheets UI", () => {
  test.use({ storageState: ".auth/demo.json" });

  test("slash menu → Database creates a sheet that renders below the editor", async ({
    page,
  }) => {
    const { wsId, pageId } = await createFreshPageInFirstWorkspace(page, "Sheet Test");

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "domcontentloaded" });
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
    const { wsId, pageId } = await createFreshPageInFirstWorkspace(page, "Formula Test");
    const api = page.context().request;

    // Create a sheet + columns via the API (deterministic).
    const dbId = (
      await (await api.post(`/api/v1/pages/${pageId}/databases`, {
        data: { title: "Math", icon: "📊" },
        headers: HEADERS,
      })).json()
    ).data.database.id as string;
    const numId = (
      await (await api.post(`/api/v1/databases/${dbId}/properties`, {
        data: { name: "N", type: "number" },
        headers: HEADERS,
      })).json()
    ).data.property.id as string;
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: { name: "Bad", type: "formula", options: { formula: 'prop("Nope")' } },
      headers: HEADERS,
    });
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: {
        name: "Doubled",
        type: "formula",
        options: { formula: 'prop("N") * 2' },
      },
      headers: HEADERS,
    });
    const rowId = (
      await (await api.post(`/api/v1/databases/${dbId}/rows`, {
        data: {},
        headers: HEADERS,
      })).json()
    ).data.row.page_id as string;
    await api.patch(`/api/v1/rows/${rowId}/properties/${numId}`, {
      data: { value: 21 },
      headers: HEADERS,
    });

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "domcontentloaded" });
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
    const { wsId, pageId } = await createFreshPageInFirstWorkspace(page, "Live Update");
    const api = page.context().request;

    // Two rows, one Price column, one Total = sum(prop("Price")) column.
    const dbId = (
      await (await api.post(`/api/v1/pages/${pageId}/databases`, {
        data: { title: "Live", icon: "📊" },
        headers: HEADERS,
      })).json()
    ).data.database.id as string;
    const priceId = (
      await (await api.post(`/api/v1/databases/${dbId}/properties`, {
        data: { name: "Price", type: "number" },
        headers: HEADERS,
      })).json()
    ).data.property.id as string;
    await api.post(`/api/v1/databases/${dbId}/properties`, {
      data: {
        name: "Total",
        type: "formula",
        options: { formula: 'sum(prop("Price"))' },
      },
      headers: HEADERS,
    });
    const rowA = (
      await (await api.post(`/api/v1/databases/${dbId}/rows`, {
        data: {},
        headers: HEADERS,
      })).json()
    ).data.row.page_id as string;
    const rowB = (
      await (await api.post(`/api/v1/databases/${dbId}/rows`, {
        data: {},
        headers: HEADERS,
      })).json()
    ).data.row.page_id as string;
    await api.patch(`/api/v1/rows/${rowA}/properties/${priceId}`, {
      data: { value: 10 },
      headers: HEADERS,
    });
    await api.patch(`/api/v1/rows/${rowB}/properties/${priceId}`, {
      data: { value: 20 },
      headers: HEADERS,
    });

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "domcontentloaded" });
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
    const { wsId, pageId } = await createFreshPageInFirstWorkspace(page, "No Button");

    await page.goto(`/app/${wsId}/${pageId}`, { waitUntil: "domcontentloaded" });
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
