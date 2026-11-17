import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  type: "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: "error" | "info") => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "error") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
