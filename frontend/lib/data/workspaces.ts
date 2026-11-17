import * as api from "@/lib/api/workspaces";
import * as local from "./local/workspaces";
import { isLocalMode } from "./mode";
import type { WorkspaceDTO } from "@notion-clone/shared";

/**
 * Repository seam over workspaces. The UI imports from here (not lib/api)
 * so the same screen works against the local store (guest) or the API (user).
 */

export function listWorkspaces(): Promise<WorkspaceDTO[]> {
  return isLocalMode() ? local.listWorkspaces() : api.listWorkspaces();
}

export function getWorkspace(id: string): Promise<WorkspaceDTO> {
  return isLocalMode() ? local.getWorkspace(id) : api.getWorkspace(id);
}

export function createWorkspace(body: {
  name: string;
  icon?: string;
}): Promise<WorkspaceDTO> {
  return isLocalMode() ? local.createWorkspace(body) : api.createWorkspace(body);
}
