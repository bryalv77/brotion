import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ComputedCell, PropertyDTO } from "@notion-clone/shared";
import { updatePropertyValue } from "@/lib/data/databases";
import { qk } from "@/lib/queryClient";
import { Button, ErrorBanner, H2, Input, Muted } from "@/components/ui";
import {
  colorFor,
  displayCellText,
  formatComputed,
  isReadOnlyType,
  plainText,
  readSelectOptions,
  stringList,
} from "./helpers";

interface CellEditorProps {
  databaseId: string;
  viewId?: string;
  rowPageId: string;
  property: PropertyDTO;
  value: unknown;
  computed?: ComputedCell;
  /** Fixed cell width (used by the table grid). */
  width?: number;
}

/**
 * Press a cell to open a native Modal with a widget chosen by property type.
 * Saving calls updatePropertyValue and refreshes the active database view.
 */
export function CellEditor({
  databaseId,
  viewId,
  rowPageId,
  property,
  value,
  computed,
  width,
}: CellEditorProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [boolDraft, setBoolDraft] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const readOnly = isReadOnlyType(property.type);
  const options = readSelectOptions(property.options);
  const isMulti = property.type === "multi_select";
  const isToggle = property.type === "checkbox";

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isMulti) setSelected(stringList(value));
    else if (isToggle) setBoolDraft(value === true);
    else setTextDraft(plainText(value));
  }, [open, value, isMulti, isToggle]);

  const saveMut = useMutation({
    mutationFn: (next: unknown) =>
      updatePropertyValue(rowPageId, property.id, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.database(databaseId, viewId) });
      qc.invalidateQueries({ queryKey: ["database", databaseId] });
      setOpen(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not save this cell"),
  });

  const nextValue = (): unknown => {
    switch (property.type) {
      case "checkbox":
        return boolDraft;
      case "multi_select":
        return selected;
      case "number": {
        const raw = textDraft.trim();
        if (raw === "") return null;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
          setError("Enter a valid number");
          return undefined;
        }
        return parsed;
      }
      case "text":
      case "url":
      case "date":
      case "select":
      case "status":
      case "relation":
        return textDraft === "" ? null : textDraft;
      default:
        return null;
    }
  };

  const save = () => {
    const next = nextValue();
    if (next === undefined) return;
    setError(null);
    saveMut.mutate(next);
  };

  const display = readOnly
    ? formatComputed(computed)
    : displayCellText(value, property.type);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={width !== undefined ? { width } : undefined}
        className="min-w-0 rounded px-2 py-2 active:bg-surface-hover"
      >
        <Text numberOfLines={1} className="text-sm text-ink">
          {display}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[85%] gap-3 rounded-t-2xl bg-white p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <H2>{property.name}</H2>
            <Muted>{property.type}</Muted>

            {readOnly ? (
              <View className="rounded-lg bg-surface-hover px-3 py-3">
                <Text className="text-base text-ink">{display}</Text>
                <Muted className="mt-1">Computed automatically — read only.</Muted>
              </View>
            ) : isToggle ? (
              <Pressable
                onPress={() => setBoolDraft((current) => !current)}
                accessibilityRole="checkbox"
                className="flex-row items-center gap-3 rounded-lg bg-surface-hover px-3 py-3"
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded border ${
                    boolDraft ? "border-accent bg-accent" : "border-inkFaint bg-white"
                  }`}
                >
                  {boolDraft ? <Text className="text-white">✓</Text> : null}
                </View>
                <Text className="text-base text-ink">
                  {boolDraft ? "Checked" : "Unchecked"}
                </Text>
              </Pressable>
            ) : isMulti ? (
              <View className="gap-2">
                {options.length === 0 ? (
                  <Muted>This property has no options configured.</Muted>
                ) : (
                  options.map((option) => {
                    const active = selected.includes(option.value);
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          setSelected((current) =>
                            active
                              ? current.filter((item) => item !== option.value)
                              : [...current, option.value],
                          )
                        }
                        className={`flex-row items-center gap-2 rounded-lg px-3 py-2 ${
                          active ? colorFor(option.value) : "bg-surface-hover"
                        }`}
                      >
                        <Text className="text-sm text-ink">{option.value}</Text>
                        {active ? <Text className="ml-auto text-ink">✓</Text> : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            ) : property.type === "select" || property.type === "status" ? (
              <ScrollView className="max-h-64">
                <Pressable
                  onPress={() => setTextDraft("")}
                  className={`mb-1 rounded-lg px-3 py-2 ${
                    textDraft === "" ? "bg-accent" : "bg-surface-hover"
                  }`}
                >
                  <Text
                    className={`text-sm ${textDraft === "" ? "text-white" : "text-ink"}`}
                  >
                    None
                  </Text>
                </Pressable>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setTextDraft(option.value)}
                    className={`mb-1 rounded-lg px-3 py-2 ${
                      textDraft === option.value ? colorFor(option.value) : "bg-surface-hover"
                    }`}
                  >
                    <Text className="text-sm text-ink">{option.value}</Text>
                  </Pressable>
                ))}
                {options.length === 0 ? (
                  <Muted>This property has no options configured.</Muted>
                ) : null}
              </ScrollView>
            ) : (
              <Input
                autoFocus
                value={textDraft}
                onChangeText={setTextDraft}
                placeholder={
                  property.type === "date"
                    ? "YYYY-MM-DD"
                    : property.type === "number"
                      ? "0"
                      : "Enter a value"
                }
                keyboardType={property.type === "number" ? "numeric" : "default"}
                autoCapitalize={property.type === "url" ? "none" : "sentences"}
              />
            )}

            <ErrorBanner message={error} />

            <View className="flex-row justify-end gap-2">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setOpen(false)}
              />
              {!readOnly ? (
                <Button title="Save" onPress={save} loading={saveMut.isPending} />
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
