import { useQuery } from "@tanstack/react-query";
import { listWorkspaces } from "../api/workspaces.js";

export function useWorkspaces() {
  return useQuery({ queryKey: ["workspaces"], queryFn: listWorkspaces });
}
