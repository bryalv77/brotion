import { useToast } from "../stores/toast.js";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm shadow-lg ${
            t.type === "error"
              ? "bg-red-600 text-white"
              : "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
