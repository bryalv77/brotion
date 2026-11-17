import { qk } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { movePage } from "@/lib/data/pages";
import { ApiClientError } from "@/lib/api/errors";
import { useToast } from "@/stores/toast";

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
      qc.invalidateQueries({ queryKey: qk.childPages });
    },
    onError: (err) => {
      showToast(err instanceof ApiClientError ? err.message : "Move failed");
    },
  });
}
