import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { extractText } from "@notion-clone/shared";
import { getSharedPage } from "@/lib/api/permissions";
import { H1, Loading, Muted, ScrollScreen } from "@/components/ui";
import { Text } from "react-native";

const HEADING: Record<string, string> = {
  heading1: "text-2xl font-semibold",
  heading2: "text-xl font-semibold",
  heading3: "text-lg font-semibold",
};

/** Public, read-only view of a published page (plain text rendering). */
export default function SharedPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => getSharedPage(token!),
    enabled: !!token,
  });

  if (isLoading) return <Loading label="Loading page…" />;
  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Muted>This page is not available.</Muted>
      </View>
    );
  }

  return (
    <ScrollScreen>
      <View className="mx-auto w-full max-w-3xl gap-2 px-5 pt-8">
        <H1>{`${data.page.icon ? `${data.page.icon} ` : ""}${data.page.title || "Untitled"}`}</H1>
        {data.blocks.map((b) => {
          const text = extractText(b.content);
          return text ? (
            <Text key={b.id} className={`text-ink ${HEADING[b.content.type] ?? "text-base"}`}>
              {b.content.type === "bulleted_list_item" ? `• ${text}` : text}
            </Text>
          ) : null;
        })}
      </View>
    </ScrollScreen>
  );
}
