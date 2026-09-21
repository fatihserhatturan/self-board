"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * Sunucudan gelen listeyi iyimser güncellemeler için yerel state'e kopyalayan
 * sayfalar, `router.refresh()` sonrası gelen yeni prop'u yok sayıyordu (ilk
 * `useState` değeri sonraki render'larda dikkate alınmaz). Prop değişince
 * state onu izliyor — render sırasında setState, React'in önerdiği "türetilmiş
 * state" deseni.
 */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [previous, setPrevious] = useState(value);

  if (value !== previous) {
    setPrevious(value);
    setState(value);
  }

  return [state, setState];
}
