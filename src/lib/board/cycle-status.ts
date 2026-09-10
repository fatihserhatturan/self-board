import type { Cycle } from "@/lib/data/cycles";

/**
 * `src/lib/data/cycles.ts` `node:sqlite`'a bağımlı olduğu için client
 * component'lerin oradan runtime bir fonksiyon import etmesi build'i bozar
 * (`issue-view-config.ts`'teki aynı ayrım gerekçesiyle) — bu yüzden saf,
 * DB'siz durum hesaplama mantığı burada, ayrı bir dosyada tutuluyor.
 */
export type CycleStatus = "upcoming" | "active" | "completed";

export function getCycleStatus(
  cycle: Pick<Cycle, "startsAt" | "endsAt">,
  todayIso: string,
): CycleStatus {
  if (todayIso < cycle.startsAt) return "upcoming";
  if (todayIso > cycle.endsAt) return "completed";
  return "active";
}

/** Yerel saat diliminden `YYYY-MM-DD` — `toISOString()` UTC'ye çevirir, gece yarısına yakın off-by-one-day riski yaratır. */
export function todayIsoDate(): string {
  return isoDateFromDate(new Date());
}

export function isoDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` → yerel gece yarısı `Date` (UTC kaymasını önlemek için elle parse ediliyor). */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}
