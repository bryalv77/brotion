import { Text, View } from "react-native";
import type { DatabaseDTO, DatabaseRowDTO, PropertyDTO } from "@notion-clone/shared";
import { CellEditor } from "./CellEditor";
import { PageGlyph } from "@/components/ui";
import {
  formatComputed,
  groupKeys,
  groupLabel,
  isReadOnlyType,
  primaryProperty,
  rowValue,
  visibleProperties, isGroupable,
} from "./helpers";

/** Vertical list, loosely grouped by the view's group-by (or first select) property. */
export function ListView({
  db,
  viewId,
  hidden,
  groupBy,
}: {
  db: DatabaseDTO;
  viewId?: string;
  hidden: string[];
  groupBy?: string | null;
}) {
  const properties = visibleProperties(db.properties, hidden);
  const primary = primaryProperty(db.properties);
  const named = groupBy
    ? db.properties.find((p) => p.name === groupBy && isGroupable(p))
    : undefined;
  const groupProp = named ?? db.properties.find(isGroupable);
  const secondary = properties.filter((p) => p.id !== primary?.id).slice(0, 2);

  if (db.rows.length === 0) {
    return (
      <View className="py-10">
        <Text className="text-center text-sm text-inkLight">No rows</Text>
      </View>
    );
  }

  const groups = new Map<string, DatabaseRowDTO[]>();
  for (const row of db.rows) {
    const keys = groupProp ? groupKeys(row, groupProp.id) : ["__all__"];
    for (const key of keys) {
      const bucket = groups.get(key) ?? [];
      bucket.push(row);
      groups.set(key, bucket);
    }
  }

  return (
    <View className="gap-4">
      {[...groups.entries()].map(([key, rows]) => (
        <View key={key}>
          <View className="mb-1 flex-row items-center gap-2">
            <Text className="text-xs text-inkLight">
              {key === "__all__" ? "Rows" : groupLabel(key)}
            </Text>
            <Text className="text-xs text-inkFaint">{rows.length}</Text>
          </View>
          <View className="overflow-hidden rounded-lg border border-border">
            {rows.map((row) => (
              <View
                key={`${key}-${row.page_id}`}
                className="flex-row items-center gap-2 border-b border-border px-3 py-2 last:border-b-0"
              >
                {db.icon ? <Text className="text-lg">{db.icon}</Text> : <PageGlyph size={20} />}
                <View className="min-w-0 flex-1">
                  {primary ? (
                    <CellEditor
                      databaseId={db.id}
                      viewId={viewId}
                      rowPageId={row.page_id}
                      property={primary}
                      value={rowValue(row, primary.id)}
                    />
                  ) : (
                    <Text className="text-base font-medium text-ink">
                      {row.title || "Untitled"}
                    </Text>
                  )}
                  <View className="mt-1 flex-row flex-wrap gap-x-3">
                    {secondary.map((property) => (
                      <View key={property.id} className="flex-row items-center">
                        <Text className="text-xs text-inkFaint">{property.name}: </Text>
                        {isReadOnlyType(property.type) ? (
                          <Text className="text-xs text-inkLight">
                            {formatComputed(row.computed?.[property.id])}
                          </Text>
                        ) : (
                          <CellEditor
                            databaseId={db.id}
                            viewId={viewId}
                            rowPageId={row.page_id}
                            property={property}
                            value={rowValue(row, property.id)}
                            computed={row.computed?.[property.id]}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
