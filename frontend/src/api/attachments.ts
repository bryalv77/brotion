import { request } from "./client.js";

export interface AttachmentInfo {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
}

export function listAttachments(pageId: string): Promise<AttachmentInfo[]> {
  return request<{ attachments: AttachmentInfo[] }>(
    `pages/${pageId}/attachments`,
  ).then((r) => r.attachments);
}
