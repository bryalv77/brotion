import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { docToBlocks } from "./serializers.js";
import { createBlock, updateBlock, deleteBlock } from "../../api/blocks.js";
import type { BlockDTO } from "@notion-clone/shared";

type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

/**
 * Debounced autosave for the page's blocks.
 *
 * On each editor update, converts the TipTap doc to block shapes and reconciles
 * them against the last-known blocks (matched by position):
 *   - new trailing blocks → POST
 *   - blocks with changed content → PATCH
 *   - trailing blocks removed in the doc → DELETE
 *
 * Position-based matching is sufficient because the editor only emits one
 * block per top-level TipTap node, in document order. Reorder/drop is rare
 * in this MVP and falls back to "create the new shape, leave the old" — the
 * reconcile will catch up on the next sync.
 */
export function useBlockSync(pageId: string) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBlock = useCallback(
    (doc: { type: string; content?: PMNode[] }, blocks: BlockDTO[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus("saving");

      debounceRef.current = setTimeout(async () => {
        const docBlocks = docToBlocks(doc);
        const existing = blocks;

        const promises: Promise<unknown>[] = [];

        // 1) POST new blocks beyond the current tail.
        for (let i = existing.length; i < docBlocks.length; i++) {
          const b = docBlocks[i];
          promises.push(
            createBlock(pageId, { type: b.type, content: b.content }).catch(() => {
              /* swallow — toast would go here */
            }),
          );
        }

        // 2) PATCH existing blocks whose content changed.
        const overlap = Math.min(existing.length, docBlocks.length);
        for (let i = 0; i < overlap; i++) {
          const oldBlock = existing[i];
          const newContent = docBlocks[i].content;
          const oldContent = oldBlock.content as unknown as Record<string, unknown>;
          if (JSON.stringify(oldContent) !== JSON.stringify(newContent)) {
            promises.push(
              updateBlock(oldBlock.id, { content: newContent }).catch(() => {
                /* swallow */
              }),
            );
          }
        }

        // 3) DELETE trailing blocks the user removed.
        for (let i = docBlocks.length; i < existing.length; i++) {
          promises.push(
            deleteBlock(existing[i].id).catch(() => {
              /* swallow */
            }),
          );
        }

        try {
          await Promise.all(promises);
          setSaveStatus("saved");
          qc.invalidateQueries({ queryKey: ["page", pageId] });
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      }, 1000);
    },
    [pageId, qc],
  );

  return { syncBlock, saveStatus };
}
