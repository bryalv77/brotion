import { useSession } from "@/lib/session";

/**
 * Which backing store the repository layer talks to. Read imperatively
 * (zustand `getState`) so plain async functions — not just hooks — can branch.
 */
export function isLocalMode(): boolean {
  return useSession.getState().mode === "guest";
}
