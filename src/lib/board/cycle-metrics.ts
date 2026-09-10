import type { Cycle, CycleSnapshot, CycleStatusCounts } from "@/lib/data/cycles";
import { isoDateFromDate, parseIsoDate } from "@/lib/board/cycle-status";

/**
 * Cycle metrikleri — DB'siz, saf fonksiyonlar (client component'ler
 * `node:sqlite`'ı bundle'a çekmesin diye `src/lib/data/cycles.ts`'ten ayrı).
 */

/** Cycle'ın kapsadığı tüm günler (başlangıç ve bitiş dahil). */
export function cycleDays(cycle: Pick<Cycle, "startsAt" | "endsAt">): string[] {
  const days: string[] = [];
  const end = parseIsoDate(cycle.endsAt);
  for (let d = parseIsoDate(cycle.startsAt); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(isoDateFromDate(d));
  }
  return days;
}

function isWorkingDay(iso: string): boolean {
  const day = parseIsoDate(iso).getDay();
  return day !== 0 && day !== 6;
}

/**
 * Linear'ın ağırlıklı başarı yüzdesi: tamamlanan issue'lar %100,
 * başlatılmış (in-progress) issue'lar %25 sayılır.
 */
export function successPercent(counts: CycleStatusCounts): number {
  const total = counts.backlog + counts.todo + counts.inProgress + counts.done + counts.canceled;
  if (total === 0) return 0;
  const weighted = counts.done + counts.canceled + counts.inProgress * 0.25;
  return Math.round((weighted / total) * 100);
}

export function daysRemaining(cycle: Pick<Cycle, "endsAt">, todayIso: string): number {
  const diff = parseIsoDate(cycle.endsAt).getTime() - parseIsoDate(todayIso).getTime();
  return Math.max(0, Math.round(diff / 86_400_000) + 1);
}

/**
 * İdeal tamamlanma çizgisi: toplam scope, cycle'ın iş günlerine eşit
 * dağıtılır ve hafta sonlarında düzleşir (Linear'daki davranış). Cycle
 * tamamen hafta sonuysa tüm günlere eşit dağıtılır.
 */
export function buildTargetLine(days: string[], scope: number): number[] {
  const totalWorkingDays = days.filter(isWorkingDay).length;
  if (totalWorkingDays === 0) {
    return days.map((_, index) => ((index + 1) / days.length) * scope);
  }
  let elapsed = 0;
  return days.map((day) => {
    if (isWorkingDay(day)) elapsed += 1;
    return (elapsed / totalWorkingDays) * scope;
  });
}

export interface BurnupPoint {
  date: string;
  /** Snapshot yoksa `null` — çizgi o günde çizilmez (gelecek günler ya da veri öncesi). */
  scope: number | null;
  started: number | null;
  completed: number | null;
  target: number;
  isToday: boolean;
}

/**
 * Grafiğin çizeceği günlük seri. Snapshot bulunmayan günlerde bir önceki
 * değer taşınır (o gün uygulama açılmamış demektir); ilk snapshot'tan önceki
 * ve bugünden sonraki günler boş bırakılır.
 */
export function buildBurnupSeries(
  cycle: Pick<Cycle, "startsAt" | "endsAt" | "totalIssues">,
  snapshots: CycleSnapshot[],
  todayIso: string,
): BurnupPoint[] {
  const days = cycleDays(cycle);
  const byDate = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));

  const finalScope = snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.scope)) : cycle.totalIssues;
  const target = buildTargetLine(days, Math.max(finalScope, cycle.totalIssues));

  let carried: CycleSnapshot | null = null;
  return days.map((date, index) => {
    const snapshot = byDate.get(date);
    if (snapshot) carried = snapshot;
    const isFuture = date > todayIso;
    const value = isFuture ? null : carried;
    return {
      date,
      scope: value?.scope ?? null,
      started: value === null ? null : value.completed + value.started,
      completed: value?.completed ?? null,
      target: target[index],
      isToday: date === todayIso,
    };
  });
}

/** Son `count` tamamlanmış cycle'ın ortalama tamamlanan issue sayısı. */
export function averageVelocity(completedCycles: Pick<Cycle, "completedIssues">[], count = 3): number {
  const recent = completedCycles.slice(0, count);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, cycle) => sum + cycle.completedIssues, 0);
  return total / recent.length;
}

/**
 * Planlanan iş / geçmiş hız oranı. 1'in üstü "kapasitenin üstünde" demek.
 * Hız bilinmiyorsa (henüz tamamlanmış cycle yok) `null` döner.
 */
export function capacityRatio(plannedScope: number, velocity: number): number | null {
  if (velocity <= 0) return null;
  return plannedScope / velocity;
}
