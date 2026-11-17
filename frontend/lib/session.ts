import { create } from "zustand";
import type { UserDTO } from "@notion-clone/shared";
import * as authApi from "@/lib/api/auth";
import { isUnauthorized } from "@/lib/api/errors";
import { queryClient } from "@/lib/queryClient";
import { sessionFlag } from "@/lib/storage";
import { getLocalStore } from "@/lib/local/store";
import { adoptLocalData } from "@/lib/merge";
import { useToast } from "@/stores/toast";

export type SessionMode = "guest" | "user";

/**
 * Session with OPTIONAL login.
 *
 * - `guest` — no account. All data lives in the local store (IndexedDB on
 *   web, SQLite on native); the app is fully usable offline. This is the
 *   default for a brand-new visitor.
 * - `user` — signed in; data comes from the API as before.
 *
 * Signing in from guest mode uploads ("adopts") the local notes into the
 * account. Signing out returns to guest mode with a clean local notebook.
 */
interface SessionState {
  /** Null in guest mode, or while a remembered user session is offline. */
  user: UserDTO | null;
  mode: SessionMode;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  /** A remembered user session exists but the server is unreachable. */
  offline: boolean;
  initialize: () => Promise<void>;
  retryOnline: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function enterGuest(set: (partial: Partial<SessionState>) => void) {
  // Note: the guest notebook is seeded by the (app) layout when it mounts in
  // guest mode — visiting only /login or /register never writes local data,
  // so signing in from a fresh browser merges nothing.
  set({ user: null, mode: "guest", offline: false });
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  mode: "guest",
  initializing: true,
  loading: false,
  error: null,
  offline: false,

  initialize: async () => {
    set({ initializing: true, error: null });
    try {
      // No remembered session on this device → straight into local mode.
      // A brand-new visitor never touches the network (offline-first boot).
      if (!(await sessionFlag.get())) {
        enterGuest(set);
        return;
      }

      try {
        const user = await authApi.getMe();
        set({ user, mode: "user", offline: false });
        // Session restored. Quietly adopt any guest data created while this
        // device was signed out (idempotent; failures retry on next sign-in).
        if (await getLocalStore().hasContent()) {
          void adoptLocalData().then((ok) => {
            if (ok) queryClient.invalidateQueries();
          });
        }
      } catch (err) {
        if (isUnauthorized(err)) {
          // Session expired/revoked — back to local mode.
          await authApi.logout().catch(() => undefined);
          await sessionFlag.clear();
          enterGuest(set);
        } else {
          // Known user, server unreachable — offer reconnect vs. local mode.
          set({ user: null, mode: "user", offline: true });
        }
      }
    } finally {
      set({ initializing: false });
    }
  },

  retryOnline: async () => {
    // Re-run the boot check; on success the user session is restored,
    // on repeated failure the reconnect screen stays up.
    await get().initialize();
  },

  continueAsGuest: async () => {
    // Keep the remembered session flag: the next online boot restores the
    // account and adopts whatever is created locally in the meantime.
    enterGuest(set);
    queryClient.clear();
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authApi.login({ email, password });
      await sessionFlag.set();
      await finishSignIn(user, set);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Login failed",
        loading: false,
      });
      throw err;
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const user = await authApi.register({ email, password, name });
      await sessionFlag.set();
      await finishSignIn(user, set);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Registration failed",
        loading: false,
      });
      throw err;
    }
  },

  signOut: async () => {
    try {
      await authApi.logout();
    } catch {
      // The store clears local state even if the network call fails.
    }
    await sessionFlag.clear();
    enterGuest(set);
    queryClient.clear();
    set({ error: null });
  },
}));

/** Shared tail of signIn/signUp: adopt local data, then switch to user mode. */
async function finishSignIn(
  user: UserDTO,
  set: (partial: Partial<SessionState>) => void,
) {
  const merged = await adoptLocalData();
  queryClient.clear();
  set({ user, mode: "user", offline: false, loading: false });
  if (!merged) {
    useToast.getState().showToast(
      "Signed in, but your local notes could not be uploaded — they are still saved on this device and will retry next sign-in.",
    );
  }
}
