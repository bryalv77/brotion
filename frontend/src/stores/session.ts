import { create } from "zustand";
import type { UserDTO } from "@notion-clone/shared";
import * as authApi from "../api/auth.js";

interface SessionState {
  user: UserDTO | null;
  loading: boolean;
  error: string | null;
  fetchMe: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  loading: true,
  error: null,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authApi.getMe();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      const user = await authApi.login({ email, password });
      set({ user, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ error: msg });
      throw err;
    }
  },

  signUp: async (email, password, name) => {
    set({ error: null });
    try {
      const user = await authApi.register({ email, password, name });
      set({ user, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      set({ error: msg });
      throw err;
    }
  },

  signOut: async () => {
    await authApi.logout();
    set({ user: null, error: null, loading: false });
  },

  clear: () => set({ user: null, error: null, loading: false }),
}));
