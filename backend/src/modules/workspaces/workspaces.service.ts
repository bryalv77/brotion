import { getPrisma } from "../../prisma/client.js";
import { getAccessibleWorkspace } from "../auth/permissions.service.js";
import { toWorkspaceDTO } from "./workspaces.dto.js";

/**
 * Workspace business rules. The creator of a new workspace becomes its OWNER
 * and is added to `workspace_members` in the same transaction.
 */

export async function listWorkspacesForUser(userId: string) {
  const rows = await getPrisma().workspaceMember.findMany({
    where: { user_id: userId },
    include: { workspace: true },
    orderBy: { created_at: "asc" },
  });
  return rows.map((m) => toWorkspaceDTO(m.workspace, m.role));
}

export async function createWorkspace(
  userId: string,
  input: { name: string; icon?: string },
) {
  const created = await getPrisma().$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.name,
        icon: input.icon ?? null,
        created_by: userId,
      },
    });
    await tx.workspaceMember.create({
      data: { workspace_id: workspace.id, user_id: userId, role: "OWNER" },
    });
    return workspace;
  });
  return toWorkspaceDTO(created, "OWNER");
}

export async function getWorkspace(workspaceId: string, userId: string) {
  const { workspace, role } = await getAccessibleWorkspace(workspaceId, userId);
  return toWorkspaceDTO(workspace, role);
}
