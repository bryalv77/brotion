import { Text, useWindowDimensions, View } from "react-native";
import type { DatabaseDTO } from "@notion-clone/shared";
import { EmptyState } from "@/components/ui";
import {
  colorFor,
  formatValue,
  isReadOnlyType,
  plainText,
  primaryProperty,
  rowValue,
  visibleProperties,
} from "./helpers";

/** Responsive two-column card grid. */
export function GalleryView({
  db,
  hidden,
}: {
  db: DatabaseDTO;
  hidden: string[];
}) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(140, Math.floor((windowWidth - 44) / 2));
  const properties = visibleProperties(db.properties, hidden);
  const primary = primaryProperty(db.properties);
  const secondary = properties.filter((p) => p.id !== primary?.id).slice(0, 2);

  if (db.rows.length === 0) {
    return <EmptyState title="No rows" message="Add a row to get started." />;
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {db.rows.map((row) => (
        <View
          key={row.page_id}
          style={{ width: cardWidth }}
          className="overflow-hidden rounded-xl border border-border bg-white"
        >
          <View className="h-24 items-center justify-center bg-surface-hover">
            <Text className="text-4xl">{db.icon ?? "📄"}</Text>
          </View>
          <View className="gap-1 p-3">
            <Text numberOfLines={2} className="text-sm font-semibold text-ink">
              {primary
                ? plainText(rowValue(row, primary.id)) || row.title || "Untitled"
                : row.title || "Untitled"}
            </Text>
            {secondary.map((property) => {
              const value = rowValue(row, property.id);
              return (
                <View key={property.id} className="flex-row items-center gap-1">
                  <Text className="text-xs text-inkFaint">{property.name}: </Text>
                  {Array.isArray(value) ? (
                    <View className="flex-row flex-wrap gap-1">
                      {value.map((item, index) =>
                        typeof item === "string" ? (
                          <View key={`${item}-${index}`} className={`rounded px-1 py-0.5 ${colorFor(item)}`}>
                            <Text className="text-xs text-ink">{item}</Text>
                          </View>
                        ) : null,
                      )}
                    </View>
                  ) : (
                    <Text numberOfLines={1} className="flex-1 text-xs text-inkLight">
                      {isReadOnlyType(property.type) ? "—" : formatValue(value)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
