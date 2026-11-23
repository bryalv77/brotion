import { Pressable } from "react-native";
import { Star } from "lucide-react-native";
import { useSidebarPrefs } from "@/stores/sidebarPrefs";
import { colors } from "@/lib/theme";

/** Star toggle that adds/removes a page from "Featured Pages". */
export function FeaturedStar({ pageId }: { pageId: string }) {
  const on = useSidebarPrefs((s) => s.featured.includes(pageId));
  const toggle = useSidebarPrefs((s) => s.toggleFeatured);
  return (
    <Pressable
      onPress={() => toggle(pageId)}
      accessibilityRole="button"
      accessibilityLabel={on ? "Remove from featured" : "Add to featured"}
      hitSlop={8}
      className="h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover"
    >
      <Star
        size={18}
        strokeWidth={1.5}
        color={on ? colors.warning : colors.inkLight}
        fill={on ? colors.warning : "none"}
      />
    </Pressable>
  );
}
