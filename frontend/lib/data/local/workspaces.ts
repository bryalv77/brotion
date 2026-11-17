import type { WorkspaceDTO } from "@notion-clone/shared";
import { getLocalStore } from "@/lib/local/store";
import { newId } from "@/lib/local/ids";
import { notFound } from "./util";

/** Local (guest) workspace operations. Mirrors lib/api/workspaces.ts. */

export async function listWorkspaces(): Promise<WorkspaceDTO[]> {
  return getLocalStore().listWorkspaces();
}

export async function getWorkspace(id: string): Promise<WorkspaceDTO> {
  const ws = await getLocalStore().getWorkspace(id);
  if (!ws) throw notFound("Workspace not found.");
  return ws;
}

export async function createWorkspace(body: {
  name: string;
  icon?: string;
}): Promise<WorkspaceDTO> {
  const ws: WorkspaceDTO = {
    id: newId(),
    name: body.name,
    icon: body.icon ?? null,
    role: "OWNER",
  };
  await getLocalStore().putWorkspace(ws);
  return ws;
}
