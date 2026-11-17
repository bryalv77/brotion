import type { PageDTO } from "@notion-clone/shared";

const BASE = "/api/v1";

/**
 * Import a file (.md, .txt, .docx, .pdf, .xlsx) into a new page.
 * Uses multipart FormData (same pattern as the image upload).
 */
export async function importFile(
  workspaceId: string,
  file: File,
  parentId?: string,
): Promise<PageDTO> {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) formData.append("parent_id", parentId);

  const res = await fetch(`${BASE}/workspaces/${workspaceId}/import`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
    body: formData,
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Import failed (status ${res.status})`);
  }

  if (!res.ok) {
    const err =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Import failed (status ${res.status})`;
    throw new Error(err);
  }

  return (body as { data: { page: PageDTO } }).data.page;
}
