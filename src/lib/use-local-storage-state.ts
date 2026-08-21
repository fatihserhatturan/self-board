"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, boolean>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * SSR-safe boolean state backed by localStorage. Server/first paint always
 * returns `defaultValue` (no localStorage access during SSR), then reads the
 * real stored value on the client — same `useSyncExternalStore` approach as
 * `useMounted()`, avoiding a `useEffect`+`setState` hydration-mismatch fix.
 */
export function useLocalStorageState(key: string, defaultValue: boolean) {
  const getSnapshot = useCallback(() => {
    if (!cache.has(key)) {
      const raw = localStorage.getItem(key);
      cache.set(key, raw === null ? defaultValue : raw === "true");
    }
    return cache.get(key)!;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: boolean) => {
      cache.set(key, next);
      localStorage.setItem(key, String(next));
      emit();
    },
    [key],
  );

  return [value, setValue] as const;
}
