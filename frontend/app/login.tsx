import { useState } from "react";
import { View } from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useSession } from "@/lib/session";
import { Button, ErrorBanner, H1, Input, Muted, Screen } from "@/components/ui";

export default function LoginScreen() {
  const { user, signIn, loading, error } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Redirect href="/(app)/" />;

  const submit = async () => {
    try {
      await signIn(email.trim(), password);
      router.replace("/(app)/");
    } catch {
      // Error is surfaced by the store.
    }
  };

  return (
    <Screen centered className="px-6">
      <View className="w-full max-w-sm gap-5">
        <View>
          <H1>Sign in</H1>
          <Muted className="mt-2">Use your workspace account</Muted>
        </View>
        <ErrorBanner message={error} />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={submit}
        />
        <Button title="Sign in" onPress={submit} loading={loading} />
        <View className="flex-row justify-center gap-1">
          <Muted>No account?</Muted>
          <Link href="/register" className="text-sm font-medium text-accent">
            Sign up
          </Link>
        </View>
        <Link href="/(app)/" className="mt-2 self-center text-sm text-inkFaint">
          Continue without an account
        </Link>
      </View>
    </Screen>
  );
}
