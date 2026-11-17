import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DatabaseDTO,
  Filter,
  FilterOp,
  PropertyDTO,
  Sort,
  ViewConfig,
} from "@notion-clone/shared";
import { updateView } from "@/lib/data/databases";
import { qk } from "@/lib/queryClient";
import { isGroupable } from "./helpers";
import { Button, Chip, Divider, ErrorBanner, H2, Input, Muted } from "@/components/ui";
import { ArrowDown, ArrowUp, X } from "lucide-react-native";
import { colors } from "@/lib/theme";

const FILTER_OPS: FilterOp[] = [
  "eq",
  "ne",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "is_empty",
  "is_not_empty",
  "any_of",
  "none_of",
];

function filterValueText(value: Filter["value"]): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** Collapsible filter/sort summary with a modal editor that persists to the view. */
export function FilterSortBar({
  databaseId,
  viewId,
  db,
  config,
}: {
  databaseId: string;
  viewId?: string;
  db: DatabaseDTO;
  config: ViewConfig;
}) {
  const qc = useQueryClient();
  const activeCount = config.filters.length + config.sorts.length;
  const [expanded, setExpanded] = useState(activeCount > 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstProperty = db.properties[0]?.name ?? "";
  const [filterProperty, setFilterProperty] = useState(firstProperty);
  const [filterOp, setFilterOp] = useState<FilterOp>("contains");
  const [filterValue, setFilterValue] = useState("");
  const [sortProperty, setSortProperty] = useState(firstProperty);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const groupable = db.properties.filter(isGroupable);

  const updateMut = useMutation({
    mutationFn: (next: ViewConfig) => {
      if (!viewId) return Promise.reject(new Error("No view selected"));
      return updateView(databaseId, viewId, { config: next });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.databaseAnyView(databaseId) });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not update this view"),
  });

  const persist = (next: ViewConfig) => {
    if (!viewId) return;
    updateMut.mutate(next);
  };

  const addFilter = () => {
    if (!filterProperty) return;
    const noValue = filterOp === "is_empty" || filterOp === "is_not_empty";
    const filter: Filter = {
      property: filterProperty,
      op: filterOp,
      ...(noValue ? {} : { value: filterValue }),
    };
    persist({ ...config, filters: [...config.filters, filter] });
    setFilterValue("");
  };

  const addSort = () => {
    if (!sortProperty) return;
    const sort: Sort = { property: sortProperty, direction: sortDirection };
    persist({ ...config, sorts: [...config.sorts, sort] });
  };

  if (db.properties.length === 0) return null;

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        className="flex-row items-center gap-2 rounded-lg bg-surface-hover px-3 py-2"
      >
        <Text className="text-sm font-medium text-ink">
          Filters &amp; sorting
        </Text>
        <Text className="text-xs text-inkLight">
          {activeCount > 0 ? `${activeCount} active` : "none"}
        </Text>
      </Pressable>

      {expanded ? (
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            {config.filters.map((filter, index) => {
              const text = `${filter.property} ${filter.op}${
                filterValueText(filter.value) ? ` ${filterValueText(filter.value)}` : ""
              }`;
              return (
                <Pressable
                  key={`filter-${index}`}
                  onPress={() =>
                    persist({
                      ...config,
                      filters: config.filters.filter((_, i) => i !== index),
                    })
                  }
                  className="rounded-lg bg-surface-hover px-3 py-2"
                >
                  <View className="flex-row items-center gap-1"><Text className="text-xs text-ink">{text}</Text><X size={12} strokeWidth={1.5} color={colors.inkLight} /></View>
                </Pressable>
              );
            })}
            {config.sorts.map((sort, index) => (
              <Pressable
                key={`sort-${index}`}
                onPress={() =>
                  persist({
                    ...config,
                    sorts: config.sorts.filter((_, i) => i !== index),
                  })
                }
                className="rounded-lg bg-surface-hover px-3 py-2"
              >
                <View className="flex-row items-center gap-1">
                  {sort.direction === "asc" ? <ArrowUp size={12} strokeWidth={1.5} color={colors.inkLight} /> : <ArrowDown size={12} strokeWidth={1.5} color={colors.inkLight} />}
                  <Text className="text-xs text-ink">{sort.property}</Text>
                  <X size={12} strokeWidth={1.5} color={colors.inkLight} />
                </View>
              </Pressable>
            ))}
            {activeCount === 0 ? <Muted>No filters or sorts yet.</Muted> : null}
          </View>

          {groupable.length > 0 ? (
            <View className="flex-row flex-wrap items-center gap-1">
              <Text className="mr-1 text-xs text-inkLight">Group by:</Text>
              <Chip
                label="None"
                active={!config.group_by}
                onPress={() => persist({ ...config, group_by: null })}
              />
              {groupable.map((property) => (
                <Chip
                  key={property.id}
                  label={property.name}
                  active={config.group_by === property.name}
                  onPress={() => persist({ ...config, group_by: property.name })}
                />
              ))}
            </View>
          ) : null}

          {viewId ? (
            <Button
              title="Edit filters & sorts"
              variant="secondary"
              onPress={() => setModalOpen(true)}
              className="self-start"
            />
          ) : (
            <Muted>Save a view to add filters and sorts.</Muted>
          )}
        </View>
      ) : null}

      <ErrorBanner message={error} />

      <Modal
        visible={modalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            className="max-h-[85%] gap-3 rounded-t-2xl bg-white p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <H2>Filters &amp; sorting</H2>
            <ScrollView className="max-h-[55%]">
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">Add a filter</Text>
                <Muted>Property</Muted>
                <View className="flex-row flex-wrap gap-1">
                  {db.properties.map((property) => (
                    <Chip
                      key={property.id}
                      label={property.name}
                      active={filterProperty === property.name}
                      onPress={() => setFilterProperty(property.name)}
                    />
                  ))}
                </View>
                <Muted>Operator</Muted>
                <View className="flex-row flex-wrap gap-1">
                  {FILTER_OPS.map((op) => (
                    <Chip
                      key={op}
                      label={op}
                      active={filterOp === op}
                      onPress={() => setFilterOp(op)}
                    />
                  ))}
                </View>
                {filterOp !== "is_empty" && filterOp !== "is_not_empty" ? (
                  <>
                    <Muted>Value</Muted>
                    <Input
                      value={filterValue}
                      onChangeText={setFilterValue}
                      placeholder="Value"
                    />
                  </>
                ) : null}
                <Button title="Add filter" onPress={addFilter} loading={updateMut.isPending} />

                <Divider />

                <Text className="text-sm font-medium text-ink">Add a sort</Text>
                <Muted>Property</Muted>
                <View className="flex-row flex-wrap gap-1">
                  {db.properties.map((property) => (
                    <Chip
                      key={property.id}
                      label={property.name}
                      active={sortProperty === property.name}
                      onPress={() => setSortProperty(property.name)}
                    />
                  ))}
                </View>
                <Muted>Direction</Muted>
                <View className="flex-row gap-1">
                  <Chip
                    label="Ascending"
                    active={sortDirection === "asc"}
                    onPress={() => setSortDirection("asc")}
                  />
                  <Chip
                    label="Descending"
                    active={sortDirection === "desc"}
                    onPress={() => setSortDirection("desc")}
                  />
                </View>
                <Button title="Add sort" onPress={addSort} loading={updateMut.isPending} />
              </View>
            </ScrollView>
            <Button
              title="Done"
              variant="secondary"
              onPress={() => setModalOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
