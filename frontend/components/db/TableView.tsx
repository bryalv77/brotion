import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseDTO } from "@notion-clone/shared";
import { deleteRow } from "@/lib/data/databases";
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
  const properties = visibleProperties(db.properties, hidden);
  const primary = primaryProperty(db.properties);

  const deleteMut = useMutation({
    mutationFn: (rowPageId: string) => deleteRow(rowPageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.database(db.id, viewId) });
      qc.invalidateQueries({ queryKey: ["database", db.id] });
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
              <Text className="text-xs font-semibold text-ink" numberOfLines={1}>
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
              className="w-10 items-center justify-center"
            >
              <Text className="text-lg text-inkFaint">×</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
