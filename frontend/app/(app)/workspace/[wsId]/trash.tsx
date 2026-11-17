import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listTrashedPages, permanentDeletePage, restorePage } from "@/lib/data/pages";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/stores/toast";
import { EmptyState, H2, Loading, Muted, ScrollScreen, Button } from "@/components/ui";

export default function TrashScreen() {
  const { wsId } = useLocalSearchParams<{ wsId: string }>();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data: pages, isLoading } = useQuery({
    queryKey: qk.trash(wsId),
    queryFn: () => listTrashedPages(wsId),
    enabled: !!wsId,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: qk.trash(wsId) });
    void qc.invalidateQueries({ queryKey: qk.childPages });
  };

  const restore = async (id: string) => {
    try {
      await restorePage(id);
      refresh();
      showToast("Page restored", "info");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Restore failed");
    }
  };

  const destroy = async (id: string) => {
    try {
      await permanentDeletePage(id);
      refresh();
      showToast("Deleted permanently", "info");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (isLoading) return <Loading label="Loading trash…" />;

  return (
    <ScrollScreen>
      <View className="mb-5">
        <H2>Trash</H2>
        <Muted className="mt-1">Deleted pages can be restored until removed forever.</Muted>
      </View>
      {!pages || pages.length === 0 ? (
        <EmptyState title="Trash is empty" />
      ) : (
        <View className="gap-2">
          {pages.map((page) => (
            <View
              key={page.id}
              className="flex-row items-center gap-3 rounded-lg border border-border p-3"
            >
              <View className="flex-1">
                <Muted className="text-base font-medium text-ink">
                  {page.icon ? `${page.icon} ` : ""}{page.title || "Untitled"}
                </Muted>
              </View>
              <Button title="Restore" variant="secondary" onPress={() => restore(page.id)} />
              <Button title="Delete forever" variant="danger" onPress={() => destroy(page.id)} />
            </View>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}
