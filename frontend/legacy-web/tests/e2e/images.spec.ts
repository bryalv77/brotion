import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API,
  CSRF_HEADER,
  HEADERS,
  makePage,
  makeWorkspace,
  register,
  uniqueEmail,
} from "./helpers.js";

/**
 * Task 014 e2e: image uploads (cover + in-content image blocks).
 * Tests the backend upload pipeline + the API contract that the frontend
 * consumes. UI-level upload tests are flaky in headless Chromium (file picker
 * timing), so these cover the API contract deterministically.
 */

async function registerAndCreatePage(request: APIRequestContext): Promise<string> {
  await register(request, uniqueEmail("img"));
  const wsId = await makeWorkspace(request);
  return makePage(request, wsId, { title: "Image Test" });
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
      headers: CSRF_HEADER,
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
      headers: CSRF_HEADER,
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
      headers: CSRF_HEADER,
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
