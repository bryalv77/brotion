import { useSession } from "@/lib/session";

/**
 * Which backing store the repository layer talks to. Read imperatively
 * (zustand `getState`) so plain async functions — not just hooks — can branch.
 */
export function isLocalMode(): boolean {
  return useSession.getState().mode === "guest";
}

/**
 * Repository seam: every function on the returned object calls the local
 * (guest) implementation or the API one, chosen at call time. `local` must
 * satisfy the API module's signatures, so the two cannot drift apart.
 */
export function route<T extends object>(local: T, api: T): T {
  return new Proxy(api, {
    get:
      (_, key) =>
      (...args: unknown[]) =>
        ((isLocalMode() ? local : api)[key as keyof T] as (...a: unknown[]) => unknown)(
          ...args,
        ),
  });
}
