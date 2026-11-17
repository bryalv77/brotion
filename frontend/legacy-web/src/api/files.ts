import type { AttachmentDTO } from "@notion-clone/shared";

const BASE = "/api/v1";

/**
 * Upload an image file via the multipart `POST /files` endpoint.
 *
 * Uses FormData (NOT the JSON-only `request()` helper) so the browser sets the
 * correct `multipart/form-data; boundary=...` Content-Type. Includes the
 * `X-Requested-With` header required by the backend CSRF guard.
 */
export async function uploadImage(
  file: File,
  opts?: { pageId?: string; blockId?: string },
): Promise<AttachmentDTO> {
  const formData = new FormData();
  formData.append("file", file);
  if (opts?.pageId) formData.append("page_id", opts.pageId);
  if (opts?.blockId) formData.append("block_id", opts.blockId);

  const res = await fetch(`${BASE}/files`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      // Deliberately NOT setting Content-Type — browser sets multipart boundary.
    },
    body: formData,
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Upload failed (status ${res.status})`);
  }

  if (!res.ok) {
    const err =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Upload failed (status ${res.status})`;
    throw new Error(err);
  }

  return (body as { data: { attachment: AttachmentDTO } }).data.attachment;
}
