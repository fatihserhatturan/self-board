"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { translations } from "@/lib/i18n/translations";
import type { Locale, TranslationKey } from "@/lib/i18n/types";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale() must be used within a <LocaleProvider>");
  }
  return ctx;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocalStorageState<Locale>(
    "self-board:locale",
    "tr",
    (value) => value,
    (raw) => (raw === "en" ? "en" : "tr"),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
