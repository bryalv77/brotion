import type { Workspace, WorkspaceRole } from "@prisma/client";
import type { WorkspaceDTO } from "@notion-clone/shared";

/**
 * Map a workspace + the caller's role to the public DTO.
 * `role` is always the caller's role (not stored on the row itself).
 */
export function toWorkspaceDTO(
  workspace: Workspace,
  role: WorkspaceRole,
): WorkspaceDTO {
  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    role,
  };
}
