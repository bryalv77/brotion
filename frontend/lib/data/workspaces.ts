import * as api from "@/lib/api/workspaces";
import * as local from "./local/workspaces";
import { route } from "./mode";

/** Guest → local store, signed-in user → API. */
export const { listWorkspaces, getWorkspace, createWorkspace } = route<typeof api>(
  local,
  api,
);
