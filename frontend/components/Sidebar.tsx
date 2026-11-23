import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Moon, Search, Sun, Trash2 } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { useIsDark, useTheme } from "@/stores/theme";
import { useUI } from "@/stores/ui";
import { Keycap, Muted } from "@/components/ui";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { FeaturedPages } from "./FeaturedPages";
import { PageTree } from "./PageTree";

/** Persistent on web; rendered inside the native drawer by AppShell. */
export function Sidebar({ workspaceId }: { workspaceId?: string }) {
  const setQuickSearchOpen = useUI((s) => s.setQuickSearchOpen);
  const isDark = useIsDark();
  const setMode = useTheme((s) => s.setMode);

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
        <FeaturedPages />
        {workspaceId ? (
          <PageTree workspaceId={workspaceId} />
        ) : (
          <Muted className="px-2 py-1">No workspace selected</Muted>
        )}
      </ScrollView>

      <View className="flex-row items-center gap-1 border-t border-border px-2 py-2">
        <Pressable
          onPress={() => setMode(isDark ? "light" : "dark")}
          accessibilityRole="button"
          accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
          hitSlop={4}
          className="h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover"
        >
          {isDark ? <Sun size={16} strokeWidth={1.5} color={colors.inkLight} /> : <Moon size={16} strokeWidth={1.5} color={colors.inkLight} />}
        </Pressable>
        {workspaceId ? (
          <Link href={`/(app)/workspace/${workspaceId}/trash`} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Trash"
              hitSlop={4}
              className="h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover"
            >
              <Trash2 size={16} strokeWidth={1.5} color={colors.inkLight} />
            </Pressable>
          </Link>
        ) : null}
      </View>
    </View>
  );
}
