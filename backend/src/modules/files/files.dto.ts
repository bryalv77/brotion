import type { Attachment } from "@prisma/client";
import type { AttachmentDTO } from "@notion-clone/shared";

export function toAttachmentDTO(a: Attachment): AttachmentDTO {
  return {
    id: a.id,
    url: a.url,
    mime_type: a.mime_type,
    size_bytes: a.size_bytes,
  };
}
