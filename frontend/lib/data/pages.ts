import * as api from "@/lib/api/pages";
import * as local from "./local/pages";
import { route } from "./mode";

/** Guest → local store, signed-in user → API. */
export const {
  listChildPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  restorePage,
  movePage,
  getPageBreadcrumbs,
  permanentDeletePage,
  listTrashedPages,
} = route<typeof api>(local, api);
