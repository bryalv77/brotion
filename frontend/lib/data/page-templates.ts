import * as api from "@/lib/api/page-templates";
import * as local from "./local/misc";
import { route } from "./mode";

/** Guest → local store, signed-in user → API. */
export const { listPageTemplates, instantiatePageTemplate } = route<typeof api>(
  local,
  api,
);
