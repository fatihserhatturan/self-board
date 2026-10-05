"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

let current = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      for (const notify of listeners) notify();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  if (current === 0) current = Date.now();
  return current;
}

/**
 * Göreli zaman ("3 dk önce") için paylaşılan, 30 sn'de bir ilerleyen saat.
 * Sunucuda ve hydration'da `null`: sunucu ile istemci farklı anda render
 * edildiği için "şimdi"ye göre hesaplanan metin uyuşmazlık üretirdi. Render
 * içinde `Date.now()` çağırmak yerine `useSyncExternalStore` (bkz.
 * `use-mounted.ts`).
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
