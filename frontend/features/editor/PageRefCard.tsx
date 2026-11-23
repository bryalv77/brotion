import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getPage } from "@/lib/data/pages";
import { qk } from "@/lib/queryClient";
import { PageGlyph } from "@/components/ui";

/** Tappable link to another page; shows the page's live title/icon, falling back to the stored ones. */
export function PageRefCard({ pageId, title, icon }: { pageId: string; title: string; icon?: string | null }) {
  const { data } = useQuery({ queryKey: qk.page(pageId), queryFn: () => getPage(pageId), enabled: !!pageId });
  const shownIcon = data?.page.icon ?? icon;
  return (
    <Pressable
      onPress={() => pageId && router.push(`/(app)/page/${pageId}`)}
      accessibilityRole="link"
      className="flex-row items-center gap-2 rounded-lg border border-border px-3 py-2"
    >
      {shownIcon ? <Text className="text-lg">{shownIcon}</Text> : <PageGlyph size={20} />}
      <Text className="flex-1 text-base text-accent">{data?.page.title || title || "Untitled"}</Text>
    </Pressable>
  );
}
