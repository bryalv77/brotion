import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { FileText } from "lucide-react-native";
import { colors } from "@/lib/theme";

export function Screen({
  children,
  centered = false,
  className = "",
  ...rest
}: ViewProps & { children: React.ReactNode; centered?: boolean; className?: string }) {
  return (
    <View
      className={`flex-1 bg-white ${centered ? "items-center justify-center" : ""} ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}

export function ScrollScreen({
  children,
  className = "",
  contentClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <ScrollView className={`flex-1 bg-white ${className}`} contentContainerClassName={`p-5 ${contentClassName}`}>
      {children}
    </ScrollView>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text className="text-3xl font-semibold text-ink">{children}</Text>;
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-xl font-medium text-ink ${className}`}>{children}</Text>;
}

export function Muted({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-sm text-inkLight ${className}`}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  className = "",
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const variantClass = {
    primary: "bg-accent",
    secondary: "bg-surface-hover",
    ghost: "bg-transparent",
    danger: "bg-danger",
  }[variant];
  const textClass = variant === "primary" || variant === "danger" ? "text-white" : "text-ink";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`h-11 items-center justify-center rounded-lg px-5 ${variantClass} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : colors.ink} />
      ) : (
        <Text className={`text-base font-medium ${textClass}`}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({
  className = "",
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor={colors.inkFaint}
      className={`h-11 rounded-lg border border-border bg-white px-3 text-base text-ink ${className}`}
      {...props}
    />
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <ActivityIndicator color={colors.accent} />
      <Muted>{label}</Muted>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center gap-2 px-6 py-14">
      <Text className="text-lg font-medium text-ink">{title}</Text>
      {message ? <Muted className="text-center">{message}</Muted> : null}
      {action}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-lg bg-red-50 px-3 py-2">
      <Text className="text-sm text-danger">{message}</Text>
    </View>
  );
}

/** Fallback page icon, used when a page has no emoji. */
export function PageGlyph({ size = 16 }: { size?: number }) {
  return <FileText size={size} strokeWidth={1.5} color={colors.inkFaint} />;
}

export function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded border border-border bg-white px-1">
      <Text className="text-xs text-inkLight" style={{ fontVariant: ["tabular-nums"] }}>
        {children}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View className="h-px w-full bg-border" />;
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-lg px-3 py-2 ${active ? "bg-accent" : "bg-surface-hover"}`}
    >
      <Text className={`text-xs font-medium ${active ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
