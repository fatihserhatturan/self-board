"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/locale-provider";

const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US" };

/**
 * Aktif dile bağlı `Intl.DateTimeFormat`. Notlar ve cycle listesi kendi
 * formatlayıcısını ayrı ayrı kuruyordu; dil eşlemesi de iki yerde tekrardı.
 */
export function useDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const { locale } = useLocale();
  const tag = LOCALE_TAG[locale] ?? "en-US";
  const key = JSON.stringify(options);
  return useMemo(
    () => new Intl.DateTimeFormat(tag, JSON.parse(key) as Intl.DateTimeFormatOptions),
    [tag, key],
  );
}
