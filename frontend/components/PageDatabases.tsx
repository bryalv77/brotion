import { qk } from "@/lib/queryClient";
import { View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { usePageDatabases } from "@/hooks/usePageDatabases";
import { useCreateDatabase } from "@/hooks/useCreateDatabase";
import { DatabaseView } from "@/components/DatabaseView";
import { Button, H2, Loading } from "@/components/ui";

export function PageDatabases({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  const { data: databases, isLoading } = usePageDatabases(pageId);
  const create = useCreateDatabase(pageId);

  if (isLoading) return <Loading label="Loading databases…" />;

  return (
    <View className="gap-4">
      {databases?.map((db) => (
        <View key={db.id} className="gap-3">
          <H2>{db.icon ? `${db.icon} ` : ""}{db.title}</H2>
          <DatabaseView databaseId={db.id} />
        </View>
      ))}
      <Button
        title="New database"
        variant="secondary"
        loading={create.isPending}
        onPress={async () => {
          await create.mutateAsync({ title: "Untitled" });
          void qc.invalidateQueries({ queryKey: qk.pageDatabases(pageId) });
        }}
      />
    </View>
  );
}
