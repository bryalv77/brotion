import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addRow, listTemplates } from "@/lib/data/databases";
import { qk } from "@/lib/queryClient";
import { Button, H2, Loading, Muted } from "@/components/ui";

/** Minimal template picker: instantiate a template (or an empty row) as a new row. */
export function TemplatesModal({
  databaseId,
  viewId,
  visible,
  onClose,
}: {
  databaseId: string;
  viewId?: string;
  visible: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["database-templates", databaseId],
    queryFn: () => listTemplates(databaseId),
    enabled: visible,
  });

  const addMut = useMutation({
    mutationFn: (templateId?: string) =>
      addRow(databaseId, templateId ? { template_id: templateId } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.database(databaseId, viewId) });
      qc.invalidateQueries({ queryKey: ["database", databaseId] });
      onClose();
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[80%] gap-3 rounded-t-2xl bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          <H2>Templates</H2>
          <Muted>Start a new row from a template.</Muted>

          <ScrollView className="max-h-[50%]">
            {isLoading ? <Loading label="Loading templates…" /> : null}
            {templates?.length === 0 ? (
              <Muted>No templates for this database.</Muted>
            ) : null}
            <View className="gap-2">
              {templates?.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => addMut.mutate(template.id)}
                  disabled={addMut.isPending}
                  className="flex-row items-center gap-3 rounded-lg border border-border px-3 py-3"
                >
                  <Text className="text-2xl">{template.icon ?? "📄"}</Text>
                  <Text className="flex-1 text-base text-ink">
                    {template.name || "Untitled template"}
                  </Text>
                  <Text className="text-xs text-accent">Add</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Button
            title="Add empty row"
            variant="secondary"
            onPress={() => addMut.mutate()}
            loading={addMut.isPending}
          />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
