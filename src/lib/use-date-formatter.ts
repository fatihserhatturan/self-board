"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/locale-provider";
import { usePreferences } from "@/components/preferences-provider";
import type { DateFormat } from "@/lib/preferences-config";
import { pickRelativeUnit } from "@/lib/relative-time";

const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US" };

/**
 * Tarih biçimi bir tercih (Ayarlar > Görünüm). Çağıranlar ham `Intl` seçeneği
 * geçmek yerine niyeti söylüyor — "zaman damgası" ya da "gün/ay" — ve ayrıntı
 * düzeyini tercih belirliyor. Aksi halde her çağıran kendi seçeneklerini sabit
 * yazdığı için tercihin hiçbir etkisi olmazdı.
 */
const DATE_TIME_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: "short", timeStyle: "short" },
  medium: { dateStyle: "medium", timeStyle: "short" },
  long: { dateStyle: "long", timeStyle: "short" },
};

const DAY_MONTH_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "numeric" },
  medium: { day: "numeric", month: "short" },
  long: { day: "numeric", month: "long" },
};

export interface DateFormatters {
  /** Tam zaman damgası — not girişleri. */
  formatDateTime: (date: Date) => string;
  /** Yılsız kısa tarih — cycle aralıkları. */
  formatDayMonth: (date: Date) => string;
  /** "3 saat önce" gibi göreli zaman — wiki'de son düzenleme. `now` için `useNow()`. */
  formatRelative: (date: Date, now: number) => string;
}

export function useDateFormatter(): DateFormatters {
  const { locale } = useLocale();
  const { dateFormat } = usePreferences();
  const tag = LOCALE_TAG[locale] ?? "en-US";

  return useMemo(() => {
    const dateTime = new Intl.DateTimeFormat(tag, DATE_TIME_OPTIONS[dateFormat]);
    const dayMonth = new Intl.DateTimeFormat(tag, DAY_MONTH_OPTIONS[dateFormat]);
    const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    return {
      formatDateTime: (date: Date) => dateTime.format(date),
      formatDayMonth: (date: Date) => dayMonth.format(date),
      formatRelative: (date: Date, now: number) => {
        const { value, unit } = pickRelativeUnit(date.getTime() - now);
        return relative.format(value, unit);
      },
    };
  }, [tag, dateFormat]);
}
