import { Platform, Pressable, Text, View } from "react-native";
import { useToast } from "@/stores/toast";
import { colors } from "@/lib/theme";
import { X } from "lucide-react-native";

/** Global toast overlay. Auto-dismiss is handled by the toast store. */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  const isWeb = Platform.OS === "web";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        zIndex: 50,
        top: isWeb ? 16 : undefined,
        right: 12,
        left: isWeb ? undefined : 12,
        bottom: isWeb ? undefined : 20,
        alignItems: isWeb ? "flex-end" : "stretch",
        gap: 8,
      }}
    >
      {toasts.map((toast) => (
        <View
          key={toast.id}
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            maxWidth: isWeb ? 360 : undefined,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: toast.type === "error" ? colors.danger : colors.ink,
          }}
        >
          <Text style={{ flexShrink: 1, color: "#ffffff", fontSize: 14 }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <Pressable
              onPress={() => {
                toast.action?.onPress();
                dismiss(toast.id);
              }}
              accessibilityRole="button"
              hitSlop={12}
            >
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "500", textDecorationLine: "underline" }}>
                {toast.action.label}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => dismiss(toast.id)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            hitSlop={12}
          >
            <X size={16} strokeWidth={1.5} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
