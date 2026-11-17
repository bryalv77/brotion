import * as api from "@/lib/api/search";
import * as local from "./local/search";
import { route } from "./mode";

/** Guest → local store, signed-in user → API. */
export const { search } = route<typeof api>(local, api);
