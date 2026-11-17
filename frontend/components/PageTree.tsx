import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import type { PageSummaryDTO } from "@notion-clone/shared";
import { useChildPages } from "@/hooks/useChildPages";
import { useCreatePage } from "@/hooks/useCreatePage";
import { useToast } from "@/stores/toast";

interface PageTreeProps {
  workspaceId: string;
  parentId?: string | null;
  depth?: number;
}

/** Recursive sidebar tree. Each level loads its children with useChildPages. */
export function PageTree({ workspaceId, parentId = null, depth = 0 }: PageTreeProps) {
  const { data: pages, isLoading } = useChildPages(workspaceId, parentId);
  const createPage = useCreatePage(workspaceId);
  const pathname = usePathname();
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);

  const activePageId = pathname.match(/\/page\/([^/]+)/)?.[1];

  async function handleCreate() {
    setCreating(true);
    try {
      const page = await createPage.mutateAsync({
        title: "Untitled",
        parent_id: parentId,
      });
      router.push(`/(app)/page/${page.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create page");
    } finally {
      setCreating(false);
    }
  }

  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between px-2">
        {depth === 0 ? (
          <Text className="text-xs font-medium uppercase tracking-wide text-inkFaint">
            Pages
          </Text>
        ) : (
          <View />
        )}
        <Pressable
          onPress={() => void handleCreate()}
          disabled={creating}
          accessibilityRole="button"
          accessibilityLabel="New page"
          hitSlop={8}
          className="h-6 w-6 items-center justify-center rounded active:bg-surface-hover"
        >
          <Text className="text-lg leading-5 text-inkLight">+</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Text className="px-2 py-1 text-sm text-inkFaint">Loading…</Text>
      ) : null}

      {pages?.map((page) => (
        <PageTreeNode
          key={page.id}
          page={page}
          workspaceId={workspaceId}
          depth={depth}
          activePageId={activePageId}
        />
      ))}

      {pages?.length === 0 && !isLoading ? (
        <Text className="px-2 py-1 text-sm text-inkFaint">No pages yet</Text>
      ) : null}
    </View>
  );
}

function PageTreeNode({
  page,
  workspaceId,
  depth,
  activePageId,
}: {
  page: PageSummaryDTO;
  workspaceId: string;
  depth: number;
  activePageId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const createPage = useCreatePage(workspaceId);
  const { showToast } = useToast();
  const [creatingSub, setCreatingSub] = useState(false);
  const active = page.id === activePageId;
  const indent = depth * 14;

  async function handleAddSubpage() {
    setCreatingSub(true);
    try {
      const child = await createPage.mutateAsync({
        title: "Untitled",
        parent_id: page.id,
      });
      setExpanded(true);
      router.push(`/(app)/page/${child.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create page");
    } finally {
      setCreatingSub(false);
    }
  }

  return (
    <View>
      <View
        className="flex-row items-center rounded-md py-1 pr-1"
        style={{ paddingLeft: 6 + indent, backgroundColor: active ? "#e7e6e3" : "transparent" }}
      >
        {page.has_children ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Collapse page" : "Expand page"}
            hitSlop={8}
            className="h-5 w-4 items-center justify-center"
          >
            <Text className="text-xs text-inkFaint">{expanded ? "▾" : "▸"}</Text>
          </Pressable>
        ) : (
          <View className="h-5 w-4" />
        )}

        <Pressable
          onPress={() => router.push(`/(app)/page/${page.id}`)}
          accessibilityRole="button"
          className="min-h-6 flex-1 flex-row items-center gap-1.5"
        >
          <Text className="text-sm">{page.icon ?? "📄"}</Text>
          <Text
            numberOfLines={1}
            className={`flex-1 text-sm ${active ? "font-semibold text-ink" : "text-ink"}`}
          >
            {page.title || "Untitled"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void handleAddSubpage()}
          disabled={creatingSub}
          accessibilityRole="button"
          accessibilityLabel="Add subpage"
          hitSlop={8}
          className="h-6 w-6 items-center justify-center rounded active:bg-surface-hover"
        >
          <Text className="text-base leading-5 text-inkLight">+</Text>
        </Pressable>
      </View>

      {expanded && page.has_children ? (
        <View>
          <PageTree workspaceId={workspaceId} parentId={page.id} depth={depth + 1} />
        </View>
      ) : null}
    </View>
  );
}
