import { Linking, Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { listAttachments } from "@/lib/data/attachments";
import { qk } from "@/lib/queryClient";
import { H2, Muted } from "@/components/ui";

export function PageAttachments({ pageId }: { pageId: string }) {
  const { data: attachments } = useQuery({
    queryKey: qk.attachments(pageId),
    queryFn: () => listAttachments(pageId),
  });

  if (!attachments || attachments.length === 0) return null;

  return (
    <View className="gap-2">
      <H2>Attachments</H2>
      {attachments.map((file) => (
        <Pressable
          key={file.id}
          onPress={() => Linking.openURL(file.url).catch(() => undefined)}
          className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2"
        >
          <Muted className="flex-1 text-ink">{file.file_name}</Muted>
          <Muted className="ml-2 text-xs">{Math.round(file.size_bytes / 1024)} KB</Muted>
        </Pressable>
      ))}
    </View>
  );
}
