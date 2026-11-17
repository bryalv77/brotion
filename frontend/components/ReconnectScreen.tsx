import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Button, H1, Muted, Screen } from "@/components/ui";

/**
 * Shown when a remembered account session exists but the server can't be
 * reached. Account data needs the API (offline account sync is a future
 * milestone), so the choice is: retry, or switch to the local notebook —
 * local notes are adopted into the account at the next sign-in.
 */
export function ReconnectScreen({
  onRetry,
  onContinueLocal,
}: {
  onRetry: () => Promise<void>;
  onContinueLocal: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    void onRetry().finally(() => setRetrying(false));
  }

  return (
    <Screen centered className="px-6">
      <View className="w-full max-w-sm gap-5">
        <View>
          <H1>You're offline</H1>
          <Muted className="mt-1">
            Your account couldn't be reached. Check your connection and try
            again, or keep working in the local notebook — those notes stay on
            this device and sync up next time you sign in.
          </Muted>
        </View>
        {retrying ? (
          <ActivityIndicator size="large" className="mt-2" />
        ) : (
          <Button title="Try again" onPress={retry} />
        )}
        <Button title="Use local notebook" variant="secondary" onPress={onContinueLocal} />
      </View>
    </Screen>
  );
}
