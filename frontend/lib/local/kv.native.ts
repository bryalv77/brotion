import type { KV } from "./kvTypes";
import { openSqliteKV } from "./sqlite";

export function getLocalKV(): KV {
  return openSqliteKV();
}
