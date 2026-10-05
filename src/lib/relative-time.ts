const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Büyükten küçüğe: fark bu süreyi aşıyorsa o birim kullanılıyor. Ay/yıl yaklaşık. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["week", 7 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

/** 45 sn'den kısa farklar "şimdi" — yeni kaydedilmiş bir sayfa "12 saniye önce" diye titremesin. */
const NOW_THRESHOLD_MS = 45_000;

/**
 * `Intl.RelativeTimeFormat` için değer ve birim. `diffMs` geçmiş için negatif
 * (`tarih - şimdi`). Değer sıfıra doğru kırpılıyor: 59,6 dakika "59 dakika
 * önce", yuvarlanıp "60 dakika önce" olmuyor.
 */
export function pickRelativeUnit(diffMs: number): {
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
} {
  const abs = Math.abs(diffMs);
  if (abs < NOW_THRESHOLD_MS) return { value: 0, unit: "second" };
  for (const [unit, size] of UNITS) {
    if (abs >= size) return { value: Math.trunc(diffMs / size), unit };
  }
  return { value: Math.trunc(diffMs / 1000), unit: "second" };
}
