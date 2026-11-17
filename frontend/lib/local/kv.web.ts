import type { KV } from "./kvTypes";
import { openIdbKV } from "./idb";

export function getLocalKV(): KV {
  return openIdbKV();
}
