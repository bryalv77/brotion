import { Pressable, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react-native";
import { deleteDatabase } from "@/lib/data/databases";
import { qk } from "@/lib/queryClient";
import { colors } from "@/lib/theme";
import { usePageDatabases } from "@/hooks/usePageDatabases";
import { DatabaseView } from "@/components/DatabaseView";
import { H2, Loading } from "@/components/ui";

/** Shows databases not already embedded as blocks (ones made before inline databases). */
export function PageDatabases({ pageId, embeddedIds }: { pageId: string; embeddedIds: string[] }) {
  const qc = useQueryClient();
  const { data: databases, isLoading } = usePageDatabases(pageId);
  const remove = useMutation({
    mutationFn: deleteDatabase,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.pageDatabases(pageId) });
      void qc.invalidateQueries({ queryKey: qk.allPageDatabases });
    },
  });

  if (isLoading) return <Loading label="Loading databases…" />;

  return (
    <View className="gap-4">
      {databases?.filter((db) => !embeddedIds.includes(db.id)).map((db) => (
        <View key={db.id} className="gap-3">
          <View className="flex-row items-center justify-between">
            <H2>{db.icon ? `${db.icon} ` : ""}{db.title}</H2>
            <Pressable
              onPress={() => remove.mutate(db.id)}
              accessibilityRole="button"
              accessibilityLabel={`Delete database ${db.title}`}
              hitSlop={12}
              className="px-2 py-2"
            >
              <Trash2 size={16} strokeWidth={1.5} color={colors.inkFaint} />
            </Pressable>
          </View>
          <DatabaseView databaseId={db.id} />
        </View>
      ))}
    </View>
  );
}
