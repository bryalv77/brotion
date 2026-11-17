import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  type: "error" | "info";
  action?: { label: string; onPress: () => void };
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: "error" | "info", action?: Toast["action"]) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "error", action) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type, action }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, action ? 8000 : 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
