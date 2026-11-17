import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseDTO } from "@notion-clone/shared";
import { deleteRow } from "@/lib/data/databases";
import { restorePage } from "@/lib/data/pages";
import { useToast } from "@/stores/toast";
import { qk } from "@/lib/queryClient";
import { EmptyState } from "@/components/ui";
import { CellEditor } from "./CellEditor";
import {
  formatComputed,
  isReadOnlyType,
  primaryProperty,
  rowValue,
  visibleProperties,
} from "./helpers";
import { X } from "lucide-react-native";
import { colors } from "@/lib/theme";

const NAME_COLUMN_WIDTH = 190;
const COLUMN_WIDTH = 140;

/** Spreadsheet-style grid. The whole grid scrolls horizontally on small screens. */
export function TableView({
  db,
  viewId,
  hidden,
}: {
  db: DatabaseDTO;
  viewId?: string;
  hidden: string[];
}) {
  const qc = useQueryClient();
  const showToast = useToast((s) => s.showToast);
  const properties = visibleProperties(db.properties, hidden);
  const primary = primaryProperty(db.properties);

  const deleteMut = useMutation({
    mutationFn: (rowPageId: string) => deleteRow(rowPageId),
    onSuccess: (_data, rowPageId) => {
      qc.invalidateQueries({ queryKey: qk.databaseAnyView(db.id) });
      // Rows are soft-deleted, so Undo is a restore.
      showToast("Row deleted", "info", {
        label: "Undo",
        onPress: () => {
          void restorePage(rowPageId).then(() =>
            qc.invalidateQueries({ queryKey: qk.databaseAnyView(db.id) }),
          );
        },
      });
    },
  });

  if (properties.length === 0) {
    return <EmptyState title="No columns" message="This view has no visible properties." />;
  }
  if (db.rows.length === 0) {
    return <EmptyState title="No rows" message="Add a row to get started." />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Header row */}
        <View className="flex-row border-b border-border bg-surface-sidebar">
          {properties.map((property) => (
            <View
              key={property.id}
              style={{ width: property.id === primary?.id ? NAME_COLUMN_WIDTH : COLUMN_WIDTH }}
              className="border-r border-border px-2 py-2"
            >
              <Text className="text-xs font-medium text-ink" numberOfLines={1}>
                {property.name}
              </Text>
              <Text numberOfLines={1} className="text-xs text-inkLight">
                {property.type}
              </Text>
            </View>
          ))}
          <View className="w-10 px-2 py-2" />
        </View>

        {/* Data rows */}
        {db.rows.map((row) => (
          <View key={row.page_id} className="flex-row border-b border-border">
            {properties.map((property) => {
              const width = property.id === primary?.id ? NAME_COLUMN_WIDTH : COLUMN_WIDTH;
              return (
                <View
                  key={property.id}
                  style={{ width }}
                  className="justify-center border-r border-border"
                >
                  {isReadOnlyType(property.type) ? (
                    <View className="px-2 py-2">
                      <Text numberOfLines={1} className="text-sm text-inkLight">
                        {formatComputed(row.computed?.[property.id])}
                      </Text>
                    </View>
                  ) : (
                    <CellEditor
                      databaseId={db.id}
                      viewId={viewId}
                      rowPageId={row.page_id}
                      property={property}
                      value={rowValue(row, property.id)}
                      computed={row.computed?.[property.id]}
                      width={width}
                    />
                  )}
                </View>
              );
            })}
            <Pressable
              onPress={() => deleteMut.mutate(row.page_id)}
              accessibilityRole="button"
              accessibilityLabel="Delete row"
              hitSlop={12}
              className="min-h-11 w-11 items-center justify-center"
            >
              <X size={16} strokeWidth={1.5} color={colors.inkFaint} />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
