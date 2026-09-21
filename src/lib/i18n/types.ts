import type { tr } from "@/lib/i18n/translations/tr";

export type Locale = "tr" | "en";
export type TranslationKey = keyof typeof tr;

/** Dil tercihinin tutulduğu cookie — sunucu ilk render'da bunu okuyor. */
export const LOCALE_COOKIE = "self-board-locale";

export const DEFAULT_LOCALE: Locale = "tr";

export function parseLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
