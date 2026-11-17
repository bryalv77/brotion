import { Stack } from "expo-router";
import { AppShell } from "@/components/AppShell";
import { ReconnectScreen } from "@/components/ReconnectScreen";
import { useSession } from "@/lib/session";

export default function AppLayout() {
  const { mode, user, offline, retryOnline, continueAsGuest } = useSession();

  // A remembered account exists but the server is unreachable. Account data
  // needs the API, so offer reconnect or the local notebook.
  if (mode === "user" && !user && offline) {
    return (
      <ReconnectScreen
        onRetry={() => void retryOnline()}
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
