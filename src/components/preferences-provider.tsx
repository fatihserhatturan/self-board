"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preferences-config";

const PreferencesContext = createContext<Preferences>(DEFAULT_PREFERENCES);

/**
 * Sunucudan gelen tercihler. Yazma yolu `updatePreferences` sunucu eylemi +
 * `router.refresh()` — ayrı bir istemci durumu tutulmuyor ki tek doğru kaynak
 * veritabanı kalsın.
 */
export function usePreferences(): Preferences {
  return useContext(PreferencesContext);
}

export function PreferencesProvider({
  preferences,
  children,
}: {
  preferences: Preferences;
  children: ReactNode;
}) {
  return (
    <PreferencesContext.Provider value={preferences}>{children}</PreferencesContext.Provider>
  );
}
