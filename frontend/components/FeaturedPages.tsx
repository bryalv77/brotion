import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import { Star } from "lucide-react-native";
import { getPage } from "@/lib/data/pages";
import { qk } from "@/lib/queryClient";
import { useSidebarPrefs } from "@/stores/sidebarPrefs";
import { colors } from "@/lib/theme";
import { PageGlyph } from "@/components/ui";

/** Starred pages, listed above the tree. Hidden when empty. */
export function FeaturedPages() {
  const featured = useSidebarPrefs((s) => s.featured);
  // shortcut: one getPage per starred id (also fetches blocks); add a batch endpoint if the list grows.
  const results = useQueries({
    queries: featured.map((id) => ({ queryKey: qk.page(id), queryFn: () => getPage(id) })),
  });
  const pages = results.flatMap((r) => (r.data && !r.data.page.is_deleted ? [r.data.page] : []));
  if (pages.length === 0) return null;

  return (
    <View className="mb-3">
      <Text className="mb-1 px-2 text-xs text-inkFaint">Featured Pages</Text>
      {pages.map((page) => (
        <Pressable
          key={page.id}
          onPress={() => router.push(`/(app)/page/${page.id}`)}
          accessibilityRole="button"
          className="flex-row items-center gap-2 rounded-md px-2 py-2 active:bg-surface-hover"
        >
          {page.icon ? <Text className="text-sm">{page.icon}</Text> : <PageGlyph />}
          <Text numberOfLines={1} className="flex-1 text-sm text-ink">
            {page.title || "Untitled"}
          </Text>
          <Star size={12} strokeWidth={1.5} color={colors.warning} fill={colors.warning} />
        </Pressable>
      ))}
    </View>
  );
}
