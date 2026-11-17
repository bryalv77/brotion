import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { WorkspaceDTO } from "@notion-clone/shared";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useSession } from "@/lib/session";
import { createWorkspace } from "@/lib/data/workspaces";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/stores/toast";
import { Button, Input } from "@/components/ui";

/** Pull the workspace id out of a route like /(app)/workspace/abc or /workspace/abc. */
function workspaceIdFromPath(path: string): string | undefined {
  return path.match(/\/workspace\/([^/]+)/)?.[1];
}

export function WorkspaceSwitcher({ workspaceId }: { workspaceId?: string }) {
  const pathname = usePathname();
  const qc = useQueryClient();
  const { mode, signOut } = useSession();
  const { showToast } = useToast();
  const { data: workspaces, isLoading } = useWorkspaces();
  const isGuest = mode === "guest";

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const effectiveId = workspaceId ?? workspaceIdFromPath(pathname);
  const current =
    workspaces?.find((w) => w.id === effectiveId) ?? workspaces?.[0];

  function select(ws: WorkspaceDTO) {
    setOpen(false);
    router.push(`/(app)/workspace/${ws.id}`);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name });
      qc.invalidateQueries({ queryKey: qk.workspaces });
      setNewName("");
      setOpen(false);
      router.push(`/(app)/workspace/${ws.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // The store clears the user even if the network call fails.
    }
    // Sign-out lands back in the local guest notebook.
    router.replace("/(app)/");
  }

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Switch workspace"
        hitSlop={4}
        className="flex-row items-center gap-2 rounded-md px-2 py-2 active:bg-surface-hover"
      >
        <Text className="text-base">{current?.icon ?? "📁"}</Text>
        <Text numberOfLines={1} className="flex-1 text-sm font-medium text-ink">
          {current?.name ?? (isLoading ? "Loading…" : "Select workspace")}
        </Text>
        <Text className="text-xs text-inkFaint">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          {/* Backdrop is a sibling of the panel, so taps on the panel don't close it. */}
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityLabel="Close workspace menu"
            className="absolute inset-0"
          />
          <View
            className="w-full max-w-sm rounded-xl bg-white p-4"
            style={{ maxWidth: 360, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}
          >
            <Text className="mb-3 text-base font-semibold text-ink">Workspaces</Text>

            <ScrollView className="max-h-64">
              {isLoading ? (
                <Text className="px-2 py-3 text-sm text-inkFaint">Loading…</Text>
              ) : null}
              {!isLoading && workspaces?.length === 0 ? (
                <Text className="px-2 py-3 text-sm text-inkFaint">No workspaces yet</Text>
              ) : null}
              {workspaces?.map((ws) => (
                <Pressable
                  key={ws.id}
                  onPress={() => select(ws)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-2 rounded-md px-2 py-2 active:bg-surface-hover"
                >
                  <Text>{ws.icon ?? "📁"}</Text>
                  <Text numberOfLines={1} className="flex-1 text-sm text-ink">
                    {ws.name}
                  </Text>
                  {ws.id === effectiveId ? (
                    <Text className="text-sm text-accent">✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>

            <View className="my-3 h-px bg-border" />

            <Text className="mb-2 text-xs font-medium uppercase tracking-wide text-inkFaint">
              New workspace
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Workspace name"
                  onSubmitEditing={() => void handleCreate()}
                />
              </View>
              <Button title="Create" onPress={() => void handleCreate()} loading={creating} disabled={!newName.trim()} />
            </View>

            <View className="mt-4 h-px bg-border" />
            {isGuest ? (
              <View className="gap-1">
                <Button
                  title="Sign in to sync"
                  onPress={() => {
                    setOpen(false);
                    router.push("/login");
                  }}
                />
                <Text className="px-1 py-1.5 text-center text-xs text-inkFaint">
                  Notes are saved on this device. Sign in to sync them
                  everywhere — your local notes are uploaded automatically.
                </Text>
              </View>
            ) : (
              <Button title="Sign out" variant="ghost" onPress={() => void handleSignOut()} className="mt-2" />
            )}
            <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} className="mt-1" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
