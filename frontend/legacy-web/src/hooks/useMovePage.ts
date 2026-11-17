import { useMutation, useQueryClient } from "@tanstack/react-query";
import { movePage } from "../api/pages.js";
import { ApiClientError } from "../api/client.js";
import { useToast } from "../stores/toast.js";

/**
 * Reparent a page (drag-to-nest in the sidebar). Invalidates the whole
 * children-cache slice so both the old and new parent lists refresh.
 */
export function useMovePage() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, newParentId }: { id: string; newParentId: string | null }) =>
      movePage(id, newParentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages", "children"] });
    },
    onError: (err) => {
      showToast(err instanceof ApiClientError ? err.message : "Move failed");
    },
  });
}
