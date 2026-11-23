import { ThemedModal } from "@/components/ThemedModal";
import { useState } from "react";
import { Modal, Platform, Pressable, Share, Text, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react-native";
import { deletePage } from "@/lib/data/pages";
import { createPublicLink, deletePermission, listPermissions } from "@/lib/api/permissions";
import { useSession } from "@/lib/session";
import { useToast } from "@/stores/toast";
import { friendlyError } from "@/lib/friendlyError";
import { colors } from "@/lib/theme";
import { qk } from "@/lib/queryClient";
import { Button, H2, Muted } from "@/components/ui";

/** "⋯" button → sheet with Publish/Share and Delete for one page. */
export function PageMenu({ pageId, className = "" }: { pageId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "share" | "delete">("menu");
  const qc = useQueryClient();
  const { showToast } = useToast();
  const signedIn = useSession((s) => s.mode === "user");

  const close = () => {
    setOpen(false);
    setView("menu");
  };

  // Sharing is an API feature; guests only have a local notebook.
  const perms = useQuery({
    queryKey: ["permissions", pageId],
    queryFn: () => listPermissions(pageId),
    enabled: open && view === "share" && signedIn,
  });
  const link = perms.data?.find((p) => p.share_type === "PUBLIC_LINK");
  const url = link?.token ? Linking.createURL(`shared/${link.token}`) : null;

  const publish = useMutation({
    mutationFn: () => createPublicLink(pageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", pageId] }),
    onError: (e) => showToast(friendlyError(e, "Could not publish")),
  });
  const unpublish = useMutation({
    mutationFn: () => deletePermission(pageId, link!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", pageId] }),
    onError: (e) => showToast(friendlyError(e, "Could not unpublish")),
  });

  const remove = useMutation({
    mutationFn: () => deletePage(pageId),
    onSuccess: () => {
      close();
      void qc.invalidateQueries({ queryKey: qk.childPages });
      void qc.invalidateQueries({ queryKey: ["trash"] });
      showToast("Moved to trash", "info");
      router.replace("/(app)/");
    },
    onError: (e) => showToast(friendlyError(e, "Delete failed")),
  });

  const copy = async () => {
    if (!url) return;
    if (Platform.OS === "web" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast("Link copied", "info");
    } else {
      await Share.share({ message: url });
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Page menu"
        hitSlop={8}
        className={`h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover ${className}`}
      >
        <MoreHorizontal size={18} strokeWidth={1.5} color={colors.inkLight} />
      </Pressable>

      <ThemedModal visible={open} animationType="fade" transparent onRequestClose={close}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={close}>
          <Pressable
            className="mx-auto w-full max-w-lg gap-3 rounded-t-2xl bg-surface p-5 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            {view === "menu" ? (
              <>
                <MenuItem label="Share / publish" onPress={() => setView("share")} />
                <MenuItem label="Delete page" danger onPress={() => setView("delete")} />
              </>
            ) : view === "delete" ? (
              <>
                <H2>Delete this page?</H2>
                <Muted>It moves to Trash, where you can restore it later.</Muted>
                <Button title="Delete" variant="danger" loading={remove.isPending} onPress={() => remove.mutate()} />
                <Button title="Cancel" variant="ghost" onPress={() => setView("menu")} />
              </>
            ) : (
              <>
                <H2>Publish to the web</H2>
                {!signedIn ? (
                  <Muted>Sign in to publish pages. Guest notes only live on this device.</Muted>
                ) : perms.isLoading ? (
                  <Muted>Loading…</Muted>
                ) : link ? (
                  <>
                    <Muted>Anyone with this link can view the page.</Muted>
                    <Text selectable className="rounded-md bg-surface-hover p-3 text-sm text-ink">
                      {url}
                    </Text>
                    <Button title="Copy link" onPress={() => void copy()} />
                    <Button
                      title="Unpublish"
                      variant="secondary"
                      loading={unpublish.isPending}
                      onPress={() => unpublish.mutate()}
                    />
                  </>
                ) : (
                  <>
                    <Muted>Create a public, read-only link anyone can open.</Muted>
                    <Button title="Publish" loading={publish.isPending} onPress={() => publish.mutate()} />
                  </>
                )}
                <Button title="Back" variant="ghost" onPress={() => setView("menu")} />
              </>
            )}
          </Pressable>
        </Pressable>
      </ThemedModal>
    </>
  );
}

function MenuItem({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-11 justify-center rounded-lg px-3 active:bg-surface-hover"
    >
      <View>
        <Text className={`text-base ${danger ? "text-danger" : "text-ink"}`}>{label}</Text>
      </View>
    </Pressable>
  );
}
