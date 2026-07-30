import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Task: Import e2e — verify file import creates pages with correct blocks.
 * Tests MD (full parser), TXT (simple parser), and XLSX (table parser).
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

function uniq(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

async function setup(request: APIRequestContext): Promise<string> {
  await request.post(`${API}/auth/register`, {
    data: { email: uniq("import"), password: "password123" },
    headers: HEADERS,
  });
  const wsRes = await request.post(`${API}/workspaces`, {
    data: { name: "WS" },
    headers: HEADERS,
  });
  return (await wsRes.json()).data.workspace.id;
}

test.describe("import", () => {
  test("import a Markdown file → page with headings, lists, code", async ({ request }) => {
    const wsId = await setup(request);

    const mdContent = `# My Document\n\n## Section\n\nThis is a paragraph with **bold** text.\n\n- Item 1\n- Item 2\n\n\`\`\`js\nconsole.log("hello");\n\`\`\`\n\n> A quote`;

    const res = await request.post(`${API}/workspaces/${wsId}/import`, {
      multipart: {
        file: { name: "test.md", mimeType: "text/markdown", buffer: Buffer.from(mdContent) },
      },
      headers: { "X-Requested-With": CSRF },
    });

    expect(res.status()).toBe(201);
    const page = (await res.json()).data.page;
    expect(page.title).toBe("My Document");

    // Verify blocks were created.
    const pageRes = await request.get(`${API}/pages/${page.id}`);
    const body = await pageRes.json();
    const blocks = body.data.blocks;
    expect(blocks.length).toBeGreaterThan(3);
    expect(blocks.some((b: { type: string }) => b.type === "heading1")).toBe(true);
    expect(blocks.some((b: { type: string }) => b.type === "heading2")).toBe(true);
    expect(blocks.some((b: { type: string }) => b.type === "bulleted_list_item")).toBe(true);
    expect(blocks.some((b: { type: string }) => b.type === "code")).toBe(true);
    expect(blocks.some((b: { type: string }) => b.type === "quote")).toBe(true);
  });

  test("import a TXT file → page with paragraph blocks", async ({ request }) => {
    const wsId = await setup(request);

    const txtContent = "First line\nSecond line\nThird line";

    const res = await request.post(`${API}/workspaces/${wsId}/import`, {
      multipart: {
        file: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from(txtContent) },
      },
      headers: { "X-Requested-With": CSRF },
    });

    expect(res.status()).toBe(201);
    const page = (await res.json()).data.page;
    expect(page.title).toBe("First line");

    const pageRes = await request.get(`${API}/pages/${page.id}`);
    const blocks = (await pageRes.json()).data.blocks;
    expect(blocks.length).toBe(3);
    expect(blocks.every((b: { type: string }) => b.type === "paragraph")).toBe(true);
  });

  test("unsupported file type → 400", async ({ request }) => {
    const wsId = await setup(request);

    const res = await request.post(`${API}/workspaces/${wsId}/import`, {
      multipart: {
        file: { name: "file.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") },
      },
      headers: { "X-Requested-With": CSRF },
    });

    expect(res.status()).toBe(400);
  });

  test("unauthenticated → 401", async ({ request }) => {
    const res = await request.post(`${API}/workspaces/fake/import`, {
      multipart: {
        file: { name: "test.md", mimeType: "text/markdown", buffer: Buffer.from("# test") },
      },
    });
    expect(res.status()).toBe(401);
  });

  test("imported file is also stored as an attachment on the page", async ({ request }) => {
    const wsId = await setup(request);

    const mdContent = `# Attach Me\n\nSome content here.`;
    const res = await request.post(`${API}/workspaces/${wsId}/import`, {
      multipart: {
        file: { name: "attach-me.md", mimeType: "text/markdown", buffer: Buffer.from(mdContent) },
      },
      headers: { "X-Requested-With": CSRF },
    });

    expect(res.status()).toBe(201);
    const page = (await res.json()).data.page;

    // Page should have blocks from the parsed text.
    const pageRes = await request.get(`${API}/pages/${page.id}`);
    const blocks = (await pageRes.json()).data.blocks;
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b: { type: string }) => b.type === "heading1")).toBe(true);

    // And the original file should be listed as an attachment.
    const attRes = await request.get(`${API}/pages/${page.id}/attachments`);
    expect(attRes.status()).toBe(200);
    const attachments = (await attRes.json()).data.attachments;
    expect(attachments).toHaveLength(1);
    expect(attachments[0].file_name).toBe("attach-me.md");
    expect(attachments[0].mime_type).toBe("text/markdown");
    expect(attachments[0].url).toMatch(/^\/api\/v1\/files\//);
  });

  test("DOCX inline marks (bold, italic) are preserved", async ({ request }) => {
    const wsId = await setup(request);

    // Minimal DOCX with bold and italic runs. Built with JSZip to keep the
    // test self-contained (no fixture files committed).
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    );
    zip.file(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    );
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>plain </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>bold </w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>italic</w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>`,
    );
    const docx = await zip.generateAsync({ type: "nodebuffer" });

    const res = await request.post(`${API}/workspaces/${wsId}/import`, {
      multipart: {
        file: { name: "marks.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: docx },
      },
      headers: { "X-Requested-With": CSRF },
    });
    expect(res.status()).toBe(201);
    const page = (await res.json()).data.page;

    const pageRes = await request.get(`${API}/pages/${page.id}`);
    const blocks = (await pageRes.json()).data.blocks;
    expect(blocks).toHaveLength(1);
    const rich = (blocks[0].content as { rich_text: Array<{ text: string; marks?: string[] }> }).rich_text;
    const findRun = (text: string) => rich.find((r) => r.text.trim() === text);
    expect(findRun("bold")?.marks).toEqual(["bold"]);
    expect(findRun("italic")?.marks).toEqual(["italic"]);
  });
});
