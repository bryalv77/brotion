import { openDB, type IDBPDatabase } from "idb";
import type { KV } from "./kvTypes";

/**
 * Web adapter: IndexedDB. One object store holds every `(kind, id)` document
 * (the pair is the primary key), a second store holds meta flags. The open
 * promise is created lazily on first use so importing this module is free.
 */
const DB_NAME = "nc-local";
const KV_STORE = "kv";
const META_STORE = "meta";

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore(KV_STORE, { keyPath: ["kind", "id"] });
        d.createObjectStore(META_STORE);
      },
    });
  }
  return dbPromise;
}

export function openIdbKV(): KV {
  return {
    async get(kind, id) {
      const d = await db();
      const row = (await d.get(KV_STORE, [kind, id])) as
        | { kind: string; id: string; json: string }
        | undefined;
      return row?.json ?? null;
    },

    async list(kind) {
      const d = await db();
      const range = IDBKeyRange.bound([kind, ""], [kind, "\uffff"]);
      const rows = (await d.getAll(KV_STORE, range)) as Array<{
        kind: string;
        id: string;
        json: string;
      }>;
      return rows.map((r) => ({ id: r.id, json: r.json }));
    },

    async put(kind, id, json) {
      const d = await db();
      await d.put(KV_STORE, { kind, id, json });
    },

    async delete(kind, id) {
      const d = await db();
      await d.delete(KV_STORE, [kind, id]);
    },

    async clear() {
      const d = await db();
      await d.clear(KV_STORE);
      await d.clear(META_STORE);
    },

    async clearData() {
      const d = await db();
      await d.clear(KV_STORE);
    },

    async getMeta(key) {
      const d = await db();
      return (await d.get(META_STORE, key)) ?? null;
    },

    async setMeta(key, value) {
      const d = await db();
      await d.put(META_STORE, value, key);
    },
  };
}
