import type { Locale, TranslationKey } from "@/lib/i18n/types";
import { en } from "@/lib/i18n/translations/en";
import { tr } from "@/lib/i18n/translations/tr";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  tr,
  en,
};
