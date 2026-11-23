import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedModal } from "@/components/ThemedModal";
import { LUCIDE_ICONS, PageIcon } from "@/components/PageIcon";
import { Button, Chip, ErrorBanner, Input } from "@/components/ui";
import { uploadImage } from "@/lib/api/uploads";
import { friendlyError } from "@/lib/friendlyError";
import { useSession } from "@/lib/session";

const EMOJIS = "😀 😎 🤓 🥳 😴 🤔 🔥 ✨ 🎉 🚀 💡 📌 📝 📚 📅 ✅ ⭐ ❤️ 💼 🏠 🎯 🧠 💻 🛠️ 🎨 🎵 📷 🌱 🌍 ☕ 🍕 💰 📈 🔒 🔑 📦 🧪 ⚡ 🏆 🐶 🐱 🦄".split(" ");
type Tab = "emoji" | "icons" | "upload";

/** Pick an emoji, a Lucide icon or an uploaded image for a page. `null` clears the icon. */
export function IconPicker({
  open, pageId, onClose, onPick,
}: { open: boolean; pageId: string; onClose: () => void; onPick: (icon: string | null) => void }) {
  const [tab, setTab] = useState<Tab>("emoji");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Uploads need the API; guests have no file store.
  const canUpload = useSession((s) => s.mode === "user");

  const pick = (icon: string | null) => {
    onPick(icon);
    onClose();
  };

  const upload = async () => {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    const asset = res.assets?.[0];
    if (res.canceled || !asset) return;
    setBusy(true);
    try {
      const att = await uploadImage(
        { uri: asset.uri, name: asset.fileName ?? "icon.jpg", mimeType: asset.mimeType ?? "image/jpeg" },
        { pageId },
      );
      pick(att.url);
    } catch (e) {
      setError(friendlyError(e, "Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  const cell = "h-11 w-11 items-center justify-center rounded-lg active:bg-surface-hover";

  return (
    <ThemedModal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-5" onPress={onClose}>
        <Pressable className="max-h-[80%] w-full max-w-md rounded-2xl bg-surface p-4" onPress={() => undefined}>
          <View className="mb-3 flex-row items-center">
            <Chip label="Emoji" active={tab === "emoji"} onPress={() => setTab("emoji")} />
            <Chip label="Icons" active={tab === "icons"} onPress={() => setTab("icons")} />
            {canUpload ? <Chip label="Upload" active={tab === "upload"} onPress={() => setTab("upload")} /> : null}
            <View className="flex-1" />
            <Pressable onPress={() => pick(null)} accessibilityRole="button">
              <Text className="text-xs text-danger">Remove</Text>
            </Pressable>
          </View>
          <ErrorBanner message={error} />
          <ScrollView>
            {tab === "emoji" ? (
              <>
                <Input value={custom} onChangeText={setCustom} placeholder="Type or paste an emoji" maxLength={8} />
                {custom.trim() ? <Button title="Use this emoji" onPress={() => pick(custom.trim())} /> : null}
                <View className="mt-2 flex-row flex-wrap">
                  {EMOJIS.map((e) => (
                    <Pressable key={e} onPress={() => pick(e)} accessibilityLabel={e} className={cell}>
                      <Text className="text-2xl">{e}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : tab === "icons" ? (
              <View className="flex-row flex-wrap">
                {Object.keys(LUCIDE_ICONS).map((name) => (
                  <Pressable key={name} onPress={() => pick(`lucide:${name}`)} accessibilityLabel={name} className={cell}>
                    <PageIcon icon={`lucide:${name}`} size={22} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Button title="Choose an image" onPress={() => void upload()} loading={busy} />
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </ThemedModal>
  );
}
