import { useCallback, useEffect, useMemo, useRef } from "react";

export interface DebouncedFn {
  /** Schedule the callback (resets the timer on every call). */
  (): void;
  /** Run a pending call immediately — use before create/delete/convert. */
  flush(): void;
  /** Discard a pending call. */
  cancel(): void;
}

/**
 * Small debounce helper used to batch block PATCHes while the user types.
 *
 * It always invokes the *latest* callback (kept in a ref), so a stale closure
 * can never save outdated content. `flush()` is important for structural edits:
 * the Editor calls it before inserting/deleting/converting a block so text that
 * has not yet hit the debounce window is persisted first. Pending work is
 * flushed on unmount as a final safety net.
 */
export function useDebouncedCallback(fn: () => void, delay = 600): DebouncedFn {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      pendingRef.current = false;
      fnRef.current();
    }
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
  }, []);

  const schedule = useCallback(() => {
    pendingRef.current = true;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delay);
  }, [delay, flush]);

  // Flush on unmount so the last keystrokes are not lost on navigation.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  return useMemo(
    () => Object.assign(schedule, { flush, cancel }),
    [schedule, flush, cancel],
  );
}
