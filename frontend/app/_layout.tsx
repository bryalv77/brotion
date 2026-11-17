import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  const { initializing, initialize } = useSession();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      {initializing ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(app)" />
        </Stack>
      )}
    </QueryClientProvider>
  );
}
