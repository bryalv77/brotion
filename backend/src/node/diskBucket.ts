import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FileBucket } from "../modules/files/files.service.js";

/** Local-disk stand-in for the R2 bucket, used when running on Node. */
export function diskBucket(dir = join(process.cwd(), "storage")): FileBucket {
  return {
    async put(key, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, key), bytes);
    },
    async get(key) {
      const data = await readFile(join(dir, key)).catch(() => null);
      return data && { arrayBuffer: async () => new Uint8Array(data).buffer as ArrayBuffer };
    },
  };
}
