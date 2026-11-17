import { Platform } from "react-native";
import { multipartRequest } from "@/lib/api/client";
import type { AttachmentDTO, PageDTO } from "@notion-clone/shared";

/** Shape returned by expo-image-picker / expo-document-picker assets. */
export interface PickedAsset {
  uri: string;
  name: string;
  mimeType?: string;
}

async function appendAsset(
  form: FormData,
  key: string,
  asset: PickedAsset,
): Promise<void> {
  if (Platform.OS === "web") {
    // Expo web asset URIs are blob:/data: URLs — fetch them into a Blob.
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    form.append(key, blob, asset.name);
  } else {
    // React Native's FormData understands the { uri, name, type } file shape.
    form.append(key, {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? "application/octet-stream",
    } as never);
  }
}

export async function uploadImage(
  asset: PickedAsset,
  opts?: { pageId?: string; blockId?: string },
): Promise<AttachmentDTO> {
  const form = new FormData();
  await appendAsset(form, "file", asset);
  if (opts?.pageId) form.append("page_id", opts.pageId);
  if (opts?.blockId) form.append("block_id", opts.blockId);
  const res = await multipartRequest<{ attachment: AttachmentDTO }>("files", form);
  return res.attachment;
}

export async function importFile(
  workspaceId: string,
  asset: PickedAsset,
  parentId?: string,
): Promise<PageDTO> {
  const form = new FormData();
  await appendAsset(form, "file", asset);
  if (parentId) form.append("parent_id", parentId);
  const res = await multipartRequest<{ page: PageDTO }>(
    `workspaces/${workspaceId}/import`,
    form,
  );
  return res.page;
}
