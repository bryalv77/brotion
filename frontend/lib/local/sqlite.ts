import * as SQLite from "expo-sqlite";
import type { KV } from "./kvTypes";

/**
 * Native adapter: expo-sqlite. A single `kv` table mirrors the IndexedDB
 * layout (`(kind, id)` primary key + JSON column) so the typed layer shares
 * all logic across platforms. The database handle is opened lazily.
 */
const DB_FILE = "nc-local.db";

let ready: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  if (!ready) {
    ready = (async () => {
      const d = await SQLite.openDatabaseAsync(DB_FILE);
      await d.execAsync(`
        CREATE TABLE IF NOT EXISTS kv (
          kind TEXT NOT NULL,
          id   TEXT NOT NULL,
          json TEXT NOT NULL,
          PRIMARY KEY (kind, id)
        );
        CREATE TABLE IF NOT EXISTS meta (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      return d;
    })();
  }
  return ready;
}

export function openSqliteKV(): KV {
  return {
    async get(kind, id) {
      const d = await db();
      const row = await d.getFirstAsync<{ json: string }>(
        "SELECT json FROM kv WHERE kind = ? AND id = ?",
        [kind, id],
      );
      return row?.json ?? null;
    },

    async list(kind) {
      const d = await db();
      return d.getAllAsync<{ id: string; json: string }>(
        "SELECT id, json FROM kv WHERE kind = ?",
        [kind],
      );
    },

    async put(kind, id, json) {
      const d = await db();
      await d.runAsync(
        `INSERT INTO kv (kind, id, json) VALUES (?, ?, ?)
         ON CONFLICT(kind, id) DO UPDATE SET json = excluded.json`,
        [kind, id, json],
      );
    },

    async delete(kind, id) {
      const d = await db();
      await d.runAsync("DELETE FROM kv WHERE kind = ? AND id = ?", [kind, id]);
    },

    async clear() {
      const d = await db();
      await d.execAsync("DELETE FROM kv; DELETE FROM meta;");
    },

    async clearData() {
      const d = await db();
      await d.execAsync("DELETE FROM kv;");
    },

    async getMeta(key) {
      const d = await db();
      const row = await d.getFirstAsync<{ value: string }>(
        "SELECT value FROM meta WHERE key = ?",
        [key],
      );
      return row?.value ?? null;
    },

    async setMeta(key, value) {
      const d = await db();
      await d.runAsync(
        `INSERT INTO meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      );
    },
  };
}
