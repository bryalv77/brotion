import { request } from "./client.js";
import type { WorkspaceDTO, CreateWorkspaceRequest } from "@notion-clone/shared";

export function listWorkspaces(): Promise<WorkspaceDTO[]> {
  return request<{ workspaces: WorkspaceDTO[] }>("workspaces").then(
    (r) => r.workspaces,
  );
}

export function getWorkspace(id: string): Promise<WorkspaceDTO> {
  return request<WorkspaceDTO>(`workspaces/${id}`);
}

export function createWorkspace(
  body: CreateWorkspaceRequest,
): Promise<WorkspaceDTO> {
  return request<WorkspaceDTO>("workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
