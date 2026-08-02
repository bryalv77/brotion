import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API,
  makeBlock,
  makePage,
  makeWorkspace,
  register,
  uniqueEmail,
} from "./helpers.js";

/**
 * Task 013 e2e: page export (Markdown + PDF).
 */

async function loginAndCreatePage(request: APIRequestContext): Promise<string> {
  await register(request, uniqueEmail("export"));
  const wsId = await makeWorkspace(request);
  const pageId = await makePage(request, wsId, { title: "Export Test" });
  await makeBlock(request, pageId, "paragraph", "Hello export world");
  return pageId;
}

test.describe("page export", () => {
  test("export as Markdown returns text/markdown with content", async ({ request }) => {
    const pageId = await loginAndCreatePage(request);

    const res = await request.get(`${API}/pages/${pageId}/export?format=md`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");

    const body = await res.text();
    expect(body).toContain("#");
    expect(body.toLowerCase()).toContain("export test");
    expect(body.toLowerCase()).toContain("hello export world");
  });

  test("export as PDF returns application/pdf", async ({ request }) => {
    const pageId = await loginAndCreatePage(request);

    const res = await request.get(`${API}/pages/${pageId}/export?format=pdf`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");

    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test("invalid format → 400", async ({ request }) => {
    const pageId = await loginAndCreatePage(request);
    const res = await request.get(`${API}/pages/${pageId}/export?format=docx`);
    expect(res.status()).toBe(400);
  });

  test("unauthenticated → 401", async ({ request }) => {
    const res = await request.get(`${API}/pages/fake-id/export?format=md`);
    expect(res.status()).toBe(401);
  });
});
