import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPage } from "../api/pages.js";
import type { CreatePageRequest } from "@notion-clone/shared";

export function useCreatePage(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePageRequest) => createPage(workspaceId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages", "children"] });
    },
  });
}
