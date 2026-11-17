import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Search, Trash2 } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { useUI } from "@/stores/ui";
import { Keycap, Muted } from "@/components/ui";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { PageTree } from "./PageTree";

/** Persistent on web; rendered inside the native drawer by AppShell. */
export function Sidebar({ workspaceId }: { workspaceId?: string }) {
  const setQuickSearchOpen = useUI((s) => s.setQuickSearchOpen);

  return (
    <View className="h-full w-[280px] border-r border-border bg-surface-sidebar">
      <View className="border-b border-border p-2">
        <WorkspaceSwitcher workspaceId={workspaceId} />
      </View>

      <View className="p-2">
        <Pressable
          onPress={() => setQuickSearchOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Search pages"
          hitSlop={4}
          className="flex-row items-center gap-2 rounded-md px-2 py-2 active:bg-surface-hover"
        >
          <Search size={16} strokeWidth={1.5} color={colors.inkLight} />
          <Text className="flex-1 text-sm text-inkLight">Search</Text>
          <Keycap>⌘K</Keycap>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-2" contentContainerClassName="pb-4">
        {workspaceId ? (
          <PageTree workspaceId={workspaceId} />
        ) : (
          <Muted className="px-2 py-1">No workspace selected</Muted>
        )}
      </ScrollView>

      {workspaceId ? (
        <Link href={`/(app)/workspace/${workspaceId}/trash`} asChild>
          <Pressable
            accessibilityRole="link"
            className="flex-row items-center gap-2 border-t border-border px-4 py-3 active:bg-surface-hover"
          >
            <Trash2 size={16} strokeWidth={1.5} color={colors.inkLight} />
            <Text className="text-sm text-inkLight">Trash</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}
