import type { BlockType } from "@notion-clone/shared";
import * as api from "@/lib/api/blocks";
import * as local from "./local/blocks";
import { route } from "./mode";

export type { BlockType };

/** Guest → local store, signed-in user → API. */
export const { createBlock, updateBlock, deleteBlock } = route<typeof api>(local, api);
