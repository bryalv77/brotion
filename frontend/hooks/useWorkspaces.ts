import { useQuery } from "@tanstack/react-query";
import { listWorkspaces } from "@/lib/data/workspaces";

export function useWorkspaces() {
  return useQuery({ queryKey: ["workspaces"], queryFn: listWorkspaces });
}
