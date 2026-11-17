import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
import type { BlockDTO, BlockType } from "@notion-clone/shared";
import { createBlock, deleteBlock, updateBlock } from "@/lib/data/blocks";
import { qk, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react-native";
import { ErrorBanner } from "@/components/ui";
import { colors } from "@/lib/theme";
import { useToast } from "@/stores/toast";
import { BlockRow } from "./BlockRow";
import type { BlockConversion } from "./SlashMenu";
import { blockToText, makeBlock, textToContent } from "./blocks";
import { useDebouncedCallback } from "./useBlockSync";
import { friendlyError } from "@/lib/friendlyError";

interface PendingUpdate {
  content: Record<string, unknown>;
  type?: BlockType;
}

let tempCounter = 0;
function tempId(): string {
  tempCounter += 1;
  return `temp-${Date.now()}-${tempCounter}`;
}

/** textToContent is deliberately loosely typed; at runtime it is a schema shape. */
function toDTOContent(content: Record<string, unknown>): BlockDTO["content"] {
  return content as unknown as BlockDTO["content"];
}

function optimisticBlock(
  id: string,
  pageId: string,
  type: BlockType,
  content: Record<string, unknown>,
  order: number,
): BlockDTO {
  const now = new Date().toISOString();
  return {
    id,
    page_id: pageId,
    parent_block_id: null,
    type,
    content: toDTOContent(content),
    order,
    created_at: now,
    updated_at: now,
  };
}

export function Editor({ pageId, initialBlocks }: { pageId: string; initialBlocks: BlockDTO[] }) {
  const [blocks, setBlocks] = useState<BlockDTO[]>(() => initialBlocks);
  const blocksRef = useRef<BlockDTO[]>(initialBlocks);
  const dirtyRef = useRef<Map<string, PendingUpdate>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast((s) => s.showToast);
  const [failedSave, setFailedSave] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // A ref mirror lets every handler read the latest blocks without stale
  // closures or side effects inside a state updater.
  const setBlocksSafe = useCallback((next: BlockDTO[]) => {
    blocksRef.current = next;
    setBlocks(next);
  }, []);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk.page(pageId) });
  }, [pageId]);

  const fail = useCallback(
    (err: unknown, fallback: string) => {
      setError(friendlyError(err, fallback));
      invalidate();
    },
    [invalidate],
  );

  /** Flush all queued text edits as PATCHes (one per dirty block). */
  const saveDirty = useCallback(() => {
    const dirty = dirtyRef.current;
    if (dirty.size === 0) return;
    dirtyRef.current = new Map();
    const saves = [...dirty].map(([id, update]) =>
      updateBlock(id, update)
        .then(() => invalidate())
        .catch((err: unknown) => {
          // Keep the unsaved edit so Retry can resend it (newer edits win).
          dirtyRef.current.set(id, { ...update, ...dirtyRef.current.get(id) });
          setFailedSave(true);
          fail(err, "Could not save block");
          throw err;
        }),
    );
    Promise.all(saves).then(
      () => {
        setFailedSave(false);
        setSaveState("saved");
      },
      () => setSaveState("idle"),
    );
  }, [invalidate, fail]);

  const debouncedSave = useDebouncedCallback(saveDirty, 600);

  const queueContent = useCallback(
    (id: string, content: Record<string, unknown>, type?: BlockType) => {
      const current = blocksRef.current;
      if (!current.some((b) => b.id === id)) return;
      setSaveState("saving");
      dirtyRef.current.set(id, {
        ...dirtyRef.current.get(id),
        content,
        ...(type !== undefined ? { type } : {}),
      });
      setBlocksSafe(
        current.map((b) =>
          b.id === id
            ? { ...b, content: toDTOContent(content), ...(type !== undefined ? { type } : {}) }
            : b,
        ),
      );
    },
    [setBlocksSafe],
  );

  const handleChangeText = useCallback(
    (id: string, text: string) => {
      const block = blocksRef.current.find((b) => b.id === id);
      if (!block) return;
      queueContent(id, textToContent(block.type, text, block));
      debouncedSave();
    },
    [queueContent, debouncedSave],
  );

  const handleChangeContent = useCallback(
    (id: string, content: Record<string, unknown>) => {
      queueContent(id, content);
      debouncedSave();
    },
    [queueContent, debouncedSave],
  );

  const handleToggleChecked = useCallback(
    (id: string, checked: boolean) => {
      const block = blocksRef.current.find((b) => b.id === id);
      if (!block) return;
      queueContent(id, { ...textToContent("todo", blockToText(block), block), checked });
      debouncedSave();
    },
    [queueContent, debouncedSave],
  );

  /** Insert an empty paragraph after `afterId`, or at the end when omitted. */
  const insertParagraph = useCallback(
    (afterId?: string) => {
      debouncedSave.flush();
      const current = blocksRef.current;
      const index = afterId ? current.findIndex((b) => b.id === afterId) : current.length - 1;
      const anchor = afterId && index >= 0 ? current[index] : undefined;
      const canAnchor = Boolean(anchor && anchor.parent_block_id === null && anchor.type !== "table_row");
      const order = anchor
        ? anchor.order + 0.5
        : current.length > 0
          ? current[current.length - 1].order + 1
          : 1;

      const id = tempId();
      setBlocksSafe([
        ...current.slice(0, index + 1),
        optimisticBlock(
          id,
          pageId,
          "paragraph",
          { type: "paragraph", rich_text: [] },
          order,
        ),
        ...current.slice(index + 1),
      ]);

      const paragraph = makeBlock("paragraph");
      void createBlock(pageId, {
        type: "paragraph",
        content: paragraph.content as Record<string, unknown>,
        ...(canAnchor && anchor ? { after_id: anchor.id } : {}),
      })
        .then((created) => {
          // Keep anything the user typed into the optimistic temp block: it
          // was keyed by the temp id, so carry it over to the real block and
          // queue a PATCH for the created row.
          const local = blocksRef.current.find((b) => b.id === id);
          const pending = dirtyRef.current.get(id);
          const finalBlock = pending && local ? { ...created, content: local.content } : created;
          setBlocksSafe(blocksRef.current.map((b) => (b.id === id ? finalBlock : b)));
          if (pending) {
            dirtyRef.current.delete(id);
            dirtyRef.current.set(created.id, pending);
            debouncedSave();
          }
          invalidate();
        })
        .catch((err: unknown) => fail(err, "Could not add block"));
    },
    [pageId, debouncedSave, setBlocksSafe, invalidate, fail],
  );

  const handleDelete = useCallback(
    (id: string) => {
      debouncedSave.flush();
      dirtyRef.current.delete(id);
      const current = blocksRef.current;
      const removed = current.find((b) => b.id === id);
      const previous = removed ? current[current.indexOf(removed) - 1] : undefined;
      setBlocksSafe(current.filter((b) => b.id !== id));
      void deleteBlock(id)
        .then(() => {
          invalidate();
          if (!removed) return;
          showToast("Block deleted", "info", {
            label: "Undo",
            onPress: () => {
              // Restore as a new block at the same position; the old id is gone.
              void createBlock(pageId, {
                type: removed.type,
                content: removed.content as unknown as Record<string, unknown>,
                ...(previous && previous.parent_block_id === null ? { after_id: previous.id } : {}),
              })
                .then(() => invalidate())
                .catch((err: unknown) => fail(err, "Could not restore block"));
            },
          });
        })
        .catch((err: unknown) => fail(err, "Could not delete block"));
    },
    [pageId, debouncedSave, setBlocksSafe, invalidate, fail, showToast],
  );

  const handleConvert = useCallback(
    (id: string, conversion: BlockConversion) => {
      debouncedSave.flush();
      const current = blocksRef.current;
      const index = current.findIndex((b) => b.id === id);
      if (index < 0) return;
      const block = current[index];
      const text = blockToText(block);

      let content: Record<string, unknown>;
      switch (conversion.type) {
        case "image": {
          content = textToContent("image", text, block);
          if (conversion.extras?.url !== undefined) content.url = conversion.extras.url;
          break;
        }
        case "page_ref": {
          content = textToContent("page_ref", text, block);
          if (conversion.extras?.pageId !== undefined) content.page_id = conversion.extras.pageId;
          if (conversion.extras?.title !== undefined) content.title = conversion.extras.title;
          break;
        }
        default:
          content = textToContent(conversion.type, text, block);
      }

      if (conversion.type === "page_ref") {
        // Backend's PATCH type enum omits `page_ref`, so recreate the row in
        // place (create supports it) and then remove the original.
        const prev = index > 0 ? current[index - 1] : undefined;
        const next = index < current.length - 1 ? current[index + 1] : undefined;
        const anchor: Record<string, unknown> =
          prev && prev.parent_block_id === null && prev.type !== "table_row"
            ? { after_id: prev.id }
            : next && next.parent_block_id === null && next.type !== "table_row"
              ? { before_id: next.id }
              : {};
        const temp = tempId();
        setBlocksSafe([
          ...current.slice(0, index),
          optimisticBlock(temp, pageId, "page_ref", content, block.order),
          ...current.slice(index + 1),
        ]);
        void createBlock(pageId, { type: "page_ref", content, ...anchor })
          .then(async (created) => {
            setBlocksSafe(blocksRef.current.map((b) => (b.id === temp ? created : b)));
            await deleteBlock(id);
            invalidate();
          })
          .catch((err: unknown) => fail(err, "Could not convert block"));
        return;
      }

      dirtyRef.current.delete(id);
      setBlocksSafe(
        current.map((b) =>
          b.id === id
            ? { ...b, type: conversion.type, content: toDTOContent(content) }
            : b,
        ),
      );
      void updateBlock(id, { type: conversion.type, content })
        .then(() => invalidate())
        .catch((err: unknown) => fail(err, "Could not convert block"));
    },
    [pageId, debouncedSave, setBlocksSafe, invalidate, fail],
  );

  // table_row blocks are rendered inside their parent table, never as rows.
  const topLevel = blocks.filter((b) => b.type !== "table_row");
  let numbered = 0;
  const rows = topLevel.map((block) => {
    numbered = block.type === "numbered_list_item" ? numbered + 1 : 0;
    return {
      block,
      listIndex: numbered,
      tableRows: blocks.filter(
        (r) => r.type === "table_row" && r.parent_block_id === block.id,
      ),
    };
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        {saveState !== "idle" ? (
          <Text
            accessibilityLiveRegion="polite"
            className="px-4 pb-2 text-right text-xs text-inkLight"
          >
            {saveState === "saving" ? "Saving…" : "Saved"}
          </Text>
        ) : null}

        {error ? (
          <Pressable
            onPress={() => setError(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
          >
            <ErrorBanner message={error} />
          </Pressable>
        ) : null}
        {error && failedSave ? (
          <Pressable
            onPress={() => {
              setError(null);
              saveDirty();
            }}
            accessibilityRole="button"
            hitSlop={12}
            className="mx-4 mb-2 min-h-11 justify-center self-start"
          >
            <Text className="text-sm font-medium text-accent">Retry saving</Text>
          </Pressable>
        ) : null}

        {rows.length === 0 ? (
          <Text className="px-4 py-6 text-base text-inkFaint">
            This page is empty. Add a block below to start writing.
          </Text>
        ) : null}

        {rows.map(({ block, listIndex, tableRows }) => (
          <BlockRow
            key={block.id}
            block={block}
            listIndex={listIndex}
            tableRows={tableRows}
            onChangeText={handleChangeText}
            onChangeContent={handleChangeContent}
            onToggleChecked={handleToggleChecked}
            onAddBelow={insertParagraph}
            onDelete={handleDelete}
            onConvert={handleConvert}
          />
        ))}

        <Pressable
          onPress={() => insertParagraph()}
          accessibilityRole="button"
          className="mx-4 mt-2 min-h-11 flex-row items-center gap-2 py-2"
        >
          <Plus size={16} strokeWidth={1.5} color={colors.inkFaint} />
          <Text className="text-sm text-inkLight">Add a block</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
