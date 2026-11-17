import { useEffect } from "react";
import { Stack } from "expo-router";
import { AppShell } from "@/components/AppShell";
import { ReconnectScreen } from "@/components/ReconnectScreen";
import { useSession } from "@/lib/session";
import { ensureLocalSeeded } from "@/lib/local/seed";
import { queryClient } from "@/lib/queryClient";

export default function AppLayout() {
  const { mode, user, offline, retryOnline, continueAsGuest } = useSession();

  // Entering the app shell in guest mode seeds the local notebook (first
  // visit only). Done here — not at session init — so visiting /login or
  // /register alone never writes local data and never merges anything on
  // sign-in.
  useEffect(() => {
    if (mode === "guest") {
      void ensureLocalSeeded().then(() => queryClient.invalidateQueries());
    }
  }, [mode]);

  // A remembered account exists but the server is unreachable. Account data
  // needs the API, so offer reconnect or the local notebook.
  if (mode === "user" && !user && offline) {
    return (
      <ReconnectScreen
        onRetry={retryOnline}
        onContinueLocal={() => void continueAsGuest()}
      />
    );
  }

  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="workspace/[wsId]" />
        <Stack.Screen name="workspace/[wsId]/trash" />
        <Stack.Screen name="page/[pageId]" />
      </Stack>
    </AppShell>
  );
}
