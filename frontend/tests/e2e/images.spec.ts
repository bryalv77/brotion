import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Task 014 e2e: image uploads (cover + in-content image blocks).
 * Tests the backend upload pipeline + the API contract that the frontend
 * consumes. UI-level upload tests are flaky in headless Chromium (file picker
 * timing), so these cover the API contract deterministically.
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

function uniq(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

async function registerAndCreatePage(request: APIRequestContext): Promise<string> {
  await request.post(`${API}/auth/register`, {
    data: { email: uniq("img"), password: "password123" },
    headers: HEADERS,
  });
  const wsRes = await request.post(`${API}/workspaces`, {
    data: { name: "WS" },
    headers: HEADERS,
  });
  const wsId = (await wsRes.json()).data.workspace.id;
  const pageRes = await request.post(`${API}/workspaces/${wsId}/pages`, {
    data: { title: "Image Test" },
    headers: HEADERS,
  });
  return (await pageRes.json()).data.page.id;
}

// 1x1 transparent PNG.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

test.describe("image uploads", () => {
  test("upload an image → 201 with url; GET serves bytes", async ({ request }) => {
    const pageId = await registerAndCreatePage(request);

    const res = await request.post(`${API}/files`, {
      multipart: {
        file: { name: "tiny.png", mimeType: "image/png", buffer: TINY_PNG },
        page_id: pageId,
      },
      headers: { "X-Requested-With": CSRF },
    });
    expect(res.status()).toBe(201);
    const attachment = (await res.json()).data.attachment;
    expect(attachment.url).toMatch(/\/api\/v1\/files\//);

    // Serve.
    const key = attachment.url.split("/").pop()!;
    const served = await request.get(`${API}/files/${key}`);
    expect(served.status()).toBe(200);
    expect((await served.body()).length).toBe(TINY_PNG.length);
  });

  test("uploaded image url can be used as cover_url", async ({ request }) => {
    const pageId = await registerAndCreatePage(request);

    // Upload.
    const uploadRes = await request.post(`${API}/files`, {
      multipart: {
        file: { name: "cover.png", mimeType: "image/png", buffer: TINY_PNG },
        page_id: pageId,
      },
      headers: { "X-Requested-With": CSRF },
    });
    const imgUrl = (await uploadRes.json()).data.attachment.url;

    // Set as cover.
    const patchRes = await request.patch(`${API}/pages/${pageId}`, {
      data: { cover_url: imgUrl },
      headers: HEADERS,
    });
    expect(patchRes.status()).toBe(200);
    expect((await patchRes.json()).data.page.cover_url).toBe(imgUrl);
  });

  test("uploaded image can be used as an image block", async ({ request }) => {
    const pageId = await registerAndCreatePage(request);

    // Upload.
    const uploadRes = await request.post(`${API}/files`, {
      multipart: {
        file: { name: "block.png", mimeType: "image/png", buffer: TINY_PNG },
        page_id: pageId,
      },
      headers: { "X-Requested-With": CSRF },
    });
    const imgUrl = (await uploadRes.json()).data.attachment.url;

    // Create an image block referencing the uploaded URL.
    const blockRes = await request.post(`${API}/pages/${pageId}/blocks`, {
      data: {
        type: "image",
        content: { type: "image", url: imgUrl, alt: "test image" },
      },
      headers: HEADERS,
    });
    expect(blockRes.status()).toBe(201);
    const block = (await blockRes.json()).data.block;
    expect(block.type).toBe("image");
    expect(block.content.url).toBe(imgUrl);

    // Verify it's returned when loading the page.
    const pageRes = await request.get(`${API}/pages/${pageId}`);
    const blocks = (await pageRes.json()).data.blocks;
    expect(blocks.some((b: { type: string }) => b.type === "image")).toBe(true);
  });
});
