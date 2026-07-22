import type { PagePermission } from "@prisma/client";
import type { PermissionDTO } from "@notion-clone/shared";

export function toPermissionDTO(p: PagePermission): PermissionDTO {
  return {
    id: p.id,
    page_id: p.page_id,
    user_id: p.user_id,
    share_type: p.share_type,
    access: p.access,
    inherit: p.inherit,
    token: p.token,
  };
}
