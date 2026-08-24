"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

const defaultSerialize = (value: unknown) => String(value);
const defaultDeserialize = (raw: string) => raw === "true";

/**
 * SSR-safe state backed by localStorage. Server/first paint always returns
 * `defaultValue` (no localStorage access during SSR), then reads the real
 * stored value on the client — same `useSyncExternalStore` approach as
 * `useMounted()`, avoiding a `useEffect`+`setState` hydration-mismatch fix.
 *
 * Boolean values (the original use case) need no serialize/deserialize pair.
 * Other value types pass their own conversion functions.
 */
export function useLocalStorageState(
  key: string,
  defaultValue: boolean,
): readonly [boolean, (next: boolean) => void];
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string,
  deserialize: (raw: string) => T,
): readonly [T, (next: T) => void];
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = defaultSerialize as (value: T) => string,
  deserialize: (raw: string) => T = defaultDeserialize as unknown as (raw: string) => T,
) {
  const getSnapshot = useCallback(() => {
    if (!cache.has(key)) {
      const raw = localStorage.getItem(key);
      cache.set(key, raw === null ? defaultValue : deserialize(raw));
    }
    return cache.get(key) as T;
  }, [key, defaultValue, deserialize]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      cache.set(key, next);
      localStorage.setItem(key, serialize(next));
      emit();
    },
    [key, serialize],
  );

  return [value, setValue] as const;
}
