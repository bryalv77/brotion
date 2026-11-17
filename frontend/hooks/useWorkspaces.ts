import { qk } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { listWorkspaces } from "@/lib/data/workspaces";

export function useWorkspaces() {
  return useQuery({ queryKey: qk.workspaces, queryFn: listWorkspaces });
}
