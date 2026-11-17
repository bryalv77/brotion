import type { AttachmentInfo } from "@/lib/api/attachments";
import * as api from "@/lib/api/attachments";
import * as local from "./local/misc";
import { isLocalMode } from "./mode";

export type { AttachmentInfo };

/** Repository seam over attachments (guest pages never have any). */
export function listAttachments(pageId: string): Promise<AttachmentInfo[]> {
  return isLocalMode() ? local.listAttachments(pageId) : api.listAttachments(pageId);
}
