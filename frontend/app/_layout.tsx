import "../global.css";
import { useEffect, useLayoutEffect } from "react";
import { Platform } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useSession } from "@/lib/session";
import { vars } from "nativewind";
import { applyPalette, colors } from "@/lib/theme";
import { useIsDark } from "@/stores/theme";

export default function RootLayout() {
  const { initializing, initialize } = useSession();
  const isDark = useIsDark();
  const vals = applyPalette(isDark);
  const palette = vars(vals);

  // On web, plain CSS variables on <html> are reliable (and reach portalled modals); vars() alone left parts stale.
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    for (const [k, v] of Object.entries(vals)) document.documentElement.style.setProperty(k, v);
  });

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* key remounts so inline `colors` styles refresh on toggle */}
      <View key={String(isDark)} style={[{ flex: 1 }, palette]}>
      {initializing ? (
        <View className="flex-1 items-center justify-center bg-surface">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="shared/[token]" />
          <Stack.Screen name="(app)" />
        </Stack>
      )}
      </View>
    </QueryClientProvider>
  );
}
