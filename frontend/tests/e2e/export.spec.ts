import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Task 013 e2e: page export (Markdown + PDF).
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

async function loginAndCreatePage(request: APIRequestContext): Promise<string> {
  // Register a unique user so there's no seed collision.
  const email = `export-${Date.now()}@e2e.test`;
  await request.post(`${API}/auth/register`, {
    data: { email, password: "password123" },
    headers: HEADERS,
  });
  const wsRes = await request.post(`${API}/workspaces`, {
    data: { name: "WS" },
    headers: HEADERS,
  });
  const wsId = (await wsRes.json()).data.workspace.id;
  const pageRes = await request.post(`${API}/workspaces/${wsId}/pages`, {
    data: { title: "Export Test" },
    headers: HEADERS,
  });
  const pageId = (await pageRes.json()).data.page.id;
  // Add a paragraph block.
  await request.post(`${API}/pages/${pageId}/blocks`, {
    data: {
      type: "paragraph",
      content: {
        type: "paragraph",
        rich_text: [{ kind: "text", text: "Hello export world" }],
      },
    },
    headers: HEADERS,
  });
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
