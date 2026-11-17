import type { KV } from "./kvTypes";

/**
 * Platform adapter selector. Metro resolves `./kv` to `kv.web.ts` (IndexedDB)
 * or `kv.native.ts` (SQLite) per target platform, so each bundle contains
 * exactly one adapter — importing expo-sqlite into the web bundle (whose wasm
 * asset can't resolve) or idb into the native bundle is impossible.
 *
 * This plain file is the TypeScript fallback and never runs: both platforms
 * have a specific variant.
 */
export type { KV };

export function getLocalKV(): KV {
  throw new Error(
    "getLocalKV: no platform adapter linked (kv.web.ts / kv.native.ts)",
  );
}
