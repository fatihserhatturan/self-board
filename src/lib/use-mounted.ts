import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * SSR-safe mount check without `useEffect`+`setState` (avoids
 * react-hooks/set-state-in-effect cascading-render warnings).
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
