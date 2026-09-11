"use client";

import { useLocale } from "@/components/locale-provider";
import { CycleBurnupChart } from "@/components/cycles/cycle-burnup-chart";
import { CycleProgressRing } from "@/components/cycles/cycle-progress-ring";
import { CycleStatTiles } from "@/components/cycles/cycle-stat-tiles";
import { CycleStatusBar } from "@/components/cycles/cycle-status-bar";
import type { Cycle, CycleSnapshot } from "@/lib/data/cycles";
import { daysRemaining, successPercent } from "@/lib/board/cycle-metrics";
import { getCycleStatus } from "@/lib/board/cycle-status";
import { cn } from "@/lib/utils";

export interface CycleSummaryPanelProps {
  cycle: Cycle;
  snapshots: CycleSnapshot[];
  todayIso: string;
  className?: string;
}

/**
 * Bir cycle'ın tam panosu — `/cycles` hero'sunda, açılan cycle satırlarında ve
 * `/issues` yan panelinde aynı bileşen kullanılıyor. Yerleşim, viewport'a değil
 * panelin kendi genişliğine göre değişsin diye container query kullanıyor.
 */
export function CycleSummaryPanel({ cycle, snapshots, todayIso, className }: CycleSummaryPanelProps) {
  const { t } = useLocale();
  const status = getCycleStatus(cycle, todayIso);
  const percent = successPercent(cycle.counts);

  const tiles = [
    { label: t("cycles.stats.scope"), value: cycle.totalIssues },
    { label: t("cycles.stats.started"), value: cycle.counts.started },
    { label: t("cycles.stats.completed"), value: cycle.completedIssues },
    { label: t("cycles.stats.remaining"), value: cycle.totalIssues - cycle.completedIssues },
    ...(status === "active"
      ? [{ label: t("cycles.stats.daysLeft"), value: daysRemaining(cycle, todayIso) }]
      : []),
  ];

  return (
    <div className={cn("@container", className)}>
      <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-start @3xl:gap-8">
        <div className="flex flex-col gap-4 @3xl:w-72 @3xl:shrink-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
            <CycleProgressRing percent={percent} label={t("cycles.success.label")} size={92} />
            <CycleStatTiles tiles={tiles} className="min-w-40 flex-1 grid-cols-2 sm:grid-cols-2" />
          </div>
          <CycleStatusBar counts={cycle.counts} />
        </div>

        <div className="min-w-0 flex-1">
          <CycleBurnupChart cycle={cycle} snapshots={snapshots} todayIso={todayIso} />
        </div>
      </div>
    </div>
  );
}
