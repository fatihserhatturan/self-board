"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { translations } from "@/lib/i18n/translations";
import { LOCALE_COOKIE, parseLocale, type Locale, type TranslationKey } from "@/lib/i18n/types";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LEGACY_STORAGE_KEY = "self-board:locale";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale() must be used within a <LocaleProvider>");
  }
  return ctx;
}

function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${ONE_YEAR_SECONDS};samesite=lax`;
}

/**
 * Dil sunucudan geliyor: kök layout cookie'yi okuyup hem `<html lang>`'i hem bu
 * sağlayıcıyı besliyor. Önceden değer `localStorage`'daydı ve sunucu her zaman
 * varsayılan dille render ettiği için İngilizce seçen kullanıcı her tam
 * yüklemede önce Türkçe metin görüyordu.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [prevInitialLocale, setPrevInitialLocale] = useState(initialLocale);

  // Sunucu başka bir dil gönderdiğinde (cookie taşıması, başka bir sekmedeki
  // değişiklik sonrası refresh) yerel durum onu izler.
  if (initialLocale !== prevInitialLocale) {
    setPrevInitialLocale(initialLocale);
    setLocaleState(initialLocale);
  }

  // Cookie'den önceki sürümlerde dil localStorage'daydı; bir kerelik taşınıyor.
  // Cookie yazıldıktan sonra `router.refresh()` doğru dili sunucudan getiriyor.
  useEffect(() => {
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    } catch {
      // Site verisi kapalıysa okunamaz; varsayılanla devam.
    }
    if (!stored) return;
    const migrated = parseLocale(stored);
    writeLocaleCookie(migrated);
    if (migrated !== initialLocale) router.refresh();
  }, [initialLocale, router]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      writeLocaleCookie(next);
      document.documentElement.lang = next;
      // Sunucu tarafında render edilen metin yok ama `<html lang>` ve ileride
      // sunucudan gelecek diller için ağaç tazeleniyor.
      router.refresh();
    },
    [router],
  );

  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
