import { ScrollView, Text, View } from "react-native";
import type { DatabaseDTO, DatabaseRowDTO, DatabaseViewDTO, PropertyDTO } from "@notion-clone/shared";
import { EmptyState } from "@/components/ui";
import { CellEditor } from "./CellEditor";
import {
  colorFor,
  groupKeys,
  groupLabel,
  isReadOnlyType,
  NO_GROUP,
  plainText,
  primaryProperty,
  readSelectOptions,
  rowValue, isGroupable,
} from "./helpers";

const COLUMN_WIDTH = 240;

/** Kanban columns grouped by the view's group_by (or first select) property. */
export function BoardView({
  db,
  view,
}: {
  db: DatabaseDTO;
  view: DatabaseViewDTO;
}) {
  const named = view.config.group_by
    ? db.properties.find((p) => p.name === view.config.group_by && isGroupable(p))
    : undefined;
  const groupProp = named ?? db.properties.find(isGroupable);
  const options = groupProp ? readSelectOptions(groupProp.options) : [];
  const primary = primaryProperty(db.properties);
  const secondary = db.properties.find((p) => p.id !== groupProp?.id && p.id !== primary?.id);

  if (!groupProp || options.length === 0) {
    return (
      <EmptyState
        title="No board grouping"
        message="Set a group-by property (a Select, Status or Multi-select with options) in this view's filters & sorting to see a board."
      />
    );
  }

  const columns = [...options.map((option) => option.value), NO_GROUP];
  const buckets = new Map<string, DatabaseRowDTO[]>(columns.map((key) => [key, []]));
  for (const row of db.rows) {
    for (const key of groupKeys(row, groupProp.id)) {
      const bucket = buckets.get(key) ?? buckets.get(NO_GROUP)!;
      bucket.push(row);
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View className="flex-row gap-3 pb-2">
        {columns.map((key) => {
          const rows = buckets.get(key) ?? [];
          return (
            <View
              key={key}
              style={{ width: COLUMN_WIDTH }}
              className="rounded-lg border border-border bg-surface-sidebar"
            >
              <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
                <View className={`h-2.5 w-2.5 rounded-full ${colorFor(key)}`} />
                <Text numberOfLines={1} className="flex-1 text-xs font-semibold text-ink">
                  {groupLabel(key)}
                </Text>
                <Text className="text-xs text-inkFaint">{rows.length}</Text>
              </View>
              <View className="gap-2 p-2">
                {rows.map((row) => (
                  <View
                    key={row.page_id}
                    className="rounded-lg border border-border bg-white p-2"
                  >
                    <Text numberOfLines={2} className="text-sm font-medium text-ink">
                      {primary
                        ? plainText(rowValue(row, primary.id)) || row.title || "Untitled"
                        : row.title || "Untitled"}
                    </Text>
                    <View className="mt-2 flex-row flex-wrap items-center gap-2">
                      <View className={`rounded px-2 py-1 ${colorFor(key)}`}>
                        <Text className="text-xs text-ink">Move to…</Text>
                      </View>
                      <CellEditor
                        databaseId={db.id}
                        viewId={view.id}
                        rowPageId={row.page_id}
                        property={groupProp}
                        value={rowValue(row, groupProp.id)}
                      />
                    </View>
                    {secondary ? (
                      <Text numberOfLines={1} className="mt-1 text-xs text-inkLight">
                        {secondary.name}: {" "}
                        {isReadOnlyType(secondary.type)
                          ? "—"
                          : String(rowValue(row, secondary.id) ?? "—")}
                      </Text>
                    ) : null}
                  </View>
                ))}
                {rows.length === 0 ? (
                  <View className="rounded-lg border border-dashed border-border p-3">
                    <Text className="text-center text-xs text-inkFaint">Empty</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
