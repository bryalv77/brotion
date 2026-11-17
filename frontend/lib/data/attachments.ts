import type { AttachmentInfo } from "@/lib/api/attachments";
import * as api from "@/lib/api/attachments";
import * as local from "./local/misc";
import { route } from "./mode";

export type { AttachmentInfo };

/** Guest → local store, signed-in user → API. */
export const { listAttachments } = route<typeof api>(local, api);
