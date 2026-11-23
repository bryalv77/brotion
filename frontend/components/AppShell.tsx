import { ThemedModal } from "@/components/ThemedModal";
import type React from "react";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Sidebar } from "./Sidebar";
import { QuickSearch } from "./QuickSearch";
import { Toaster } from "./Toaster";

const SIDEBAR_WIDTH = 280;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: workspaces } = useWorkspaces();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Workspace routes carry the id in the URL. Page and index routes don't, so
  // fall back to the first workspace (the one the index route redirects to).
  const workspaceId =
    pathname.match(/\/workspace\/([^/]+)/)?.[1] ?? workspaces?.[0]?.id;

  const sidebar = <Sidebar workspaceId={workspaceId} />;

  if (Platform.OS === "web") {
    return (
      <View className="h-screen flex-row bg-surface">
        <View className="h-full shrink-0 border-r border-border" style={{ width: SIDEBAR_WIDTH }}>
          {sidebar}
        </View>
        <View className="min-w-0 flex-1">{children}</View>
        <Toaster />
        <QuickSearch />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="h-12 flex-row items-center border-b border-border px-3">
        <Pressable
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar"
          hitSlop={10}
          className="p-2"
        >
          <Menu size={20} strokeWidth={1.5} color={colors.ink} />
        </Pressable>
        <Text className="ml-3 text-base font-medium text-ink">Notion</Text>
      </View>

      <View className="flex-1">{children}</View>

      <ThemedModal
        visible={drawerOpen}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View className="flex-1 flex-row">
          <Pressable
            onPress={() => setDrawerOpen(false)}
            accessibilityLabel="Close sidebar"
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          />
          <SafeAreaView className="h-full bg-surface-sidebar" style={{ width: SIDEBAR_WIDTH }}>
            {sidebar}
          </SafeAreaView>
        </View>
      </ThemedModal>

      <Toaster />
      <QuickSearch />
    </SafeAreaView>
  );
}
