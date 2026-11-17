/**
 * Platform-agnostic key/value persistence contract backing guest (local) mode.
 *
 * Entities are stored as serialized JSON documents keyed by `(kind, id)` —
 * the typed layer (`store.ts`) owns all entity semantics, so both adapters
 * (IndexedDB on web, SQLite on native) stay trivially small.
 */
export interface KV {
  /** Fetch one document's JSON, or null when absent. */
  get(kind: string, id: string): Promise<string | null>;
  /** All documents of a kind (parse is the caller's job). */
  list(kind: string): Promise<Array<{ id: string; json: string }>>;
  /** Insert or replace a document. */
  put(kind: string, id: string, json: string): Promise<void>;
  /** Remove a document (missing id is a no-op). */
  delete(kind: string, id: string): Promise<void>;
  /** Wipe every document + meta key (used after guest data is adopted). */
  clear(): Promise<void>;
  /** Wipe documents but keep meta flags (post-adopt cleanup). */
  clearData(): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}
