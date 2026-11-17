import { adoptLocal } from "@/lib/api/me";
import { getLocalStore } from "@/lib/local/store";

/**
 * Guest → account merge ("adopt local data").
 *
 * Pushes the local snapshot to `POST /me/adopt-local`. The server preserves
 * client-generated ids and skips ids that already exist, so re-running the
 * adopt after a partial earlier attempt is safe. On success the caller wipes
 * the local data (meta flags survive, so a returning guest gets a clean
 * notebook rather than the first-run welcome content again).
 *
 * Returns true when there is nothing left locally (nothing to adopt, or the
 * upload succeeded and the store was cleared). On failure the local data is
 * kept and the merge is retried on the next sign-in.
 */
export async function adoptLocalData(): Promise<boolean> {
  const store = getLocalStore();
  if (!(await store.hasContent())) return true;

  const snap = await store.dump();
  try {
    await adoptLocal({
      workspaces: snap.workspaces,
      pages: snap.pages,
      blocks: snap.blocks,
      databases: snap.databases,
      values: snap.values,
    });
  } catch (err) {
    console.warn("[merge] adopt-local failed — keeping local data", err);
    return false;
  }

  await store.clearData();
  return true;
}
