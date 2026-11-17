import * as api from "@/lib/api/databases";
import * as local from "./local/databases";
import { route } from "./mode";

/** Guest → local store, signed-in user → API. */
export const {
  createDatabase,
  getDatabase,
  listPageDatabases,
  deleteDatabase,
  addProperty,
  updateProperty,
  deleteProperty,
  addRow,
  deleteRow,
  updatePropertyValue,
  createView,
  updateView,
  deleteView,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = route<typeof api>(local, api);
