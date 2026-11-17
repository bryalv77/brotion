import { useState } from "react";
import { View } from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useSession } from "@/lib/session";
import { Button, ErrorBanner, H1, Input, Muted, Screen } from "@/components/ui";

export default function RegisterScreen() {
  const { user, signUp, loading, error } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Redirect href="/(app)/" />;

  const submit = async () => {
    try {
      await signUp(email.trim(), password, name.trim() || undefined);
      router.replace("/(app)/");
    } catch {
      // Error is surfaced by the store.
    }
  };

  return (
    <Screen centered className="px-6">
      <View className="w-full max-w-sm gap-5">
        <View>
          <H1>Create account</H1>
          <Muted className="mt-1">Start your own workspace.</Muted>
        </View>
        <ErrorBanner message={error} />
        <Input value={name} onChangeText={setName} placeholder="Name (optional)" />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password (8+ characters)"
          accessibilityLabel="Password"
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
        <Button title="Create account" onPress={submit} loading={loading} />
        <View className="flex-row justify-center gap-1">
          <Muted>Already have an account?</Muted>
          <Link href="/login" className="text-sm font-medium text-accent">
            Sign in
          </Link>
        </View>
        <Link href="/(app)/" className="mt-2 self-center text-sm text-inkFaint">
          Continue without an account
        </Link>
      </View>
    </Screen>
  );
}
