"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { Cycle } from "@/lib/data/cycles";
import { cycleLabel } from "@/lib/board/cycle-label";
import { averageVelocity } from "@/lib/board/cycle-metrics";
import { CHART_COLORS } from "@/lib/board/chart-tokens";
import { cn } from "@/lib/utils";

const BAR_AREA_HEIGHT = 72;

export interface CycleVelocityChartProps {
  /** Tamamlanmış cycle'lar, en yeniden eskiye. */
  completedCycles: Cycle[];
  className?: string;
}

/**
 * Tek serili sütun grafiği (tamamlanan issue / cycle) — tek seri olduğu için
 * legend yok, başlık neyin çizildiğini söylüyor. Ortalama hız kesikli nötr
 * referans çizgisiyle gösteriliyor.
 */
export function CycleVelocityChart({ completedCycles, className }: CycleVelocityChartProps) {
  const { t } = useLocale();
  const recent = [...completedCycles].slice(0, 6).reverse();
  if (recent.length === 0) return null;

  const average = averageVelocity(completedCycles);
  const max = Math.max(...recent.map((cycle) => cycle.completedIssues), average, 1);

  return (
    <section className={cn("flex flex-col gap-3 rounded-lg border border-border-default p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-small font-medium text-text-primary">{t("cycles.velocity.title")}</h2>
        <span className="text-micro text-text-tertiary">
          {t("cycles.velocity.average")} {Math.round(average * 10) / 10}
        </span>
      </div>

      <div className="relative flex items-end gap-3" style={{ height: BAR_AREA_HEIGHT }}>
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-text-tertiary/55"
          style={{ bottom: `${(average / max) * BAR_AREA_HEIGHT}px` }}
          aria-hidden
        />
        {recent.map((cycle) => (
          <Tooltip
            key={cycle.id}
            content={`${cycleLabel(cycle)} · ${cycle.completedIssues}/${cycle.totalIssues}`}
          >
            <div className="flex h-full max-w-6 flex-1 cursor-default flex-col justify-end">
              <div
                className="w-full rounded-t transition-opacity hover:opacity-80"
                style={{
                  height: `${Math.max((cycle.completedIssues / max) * BAR_AREA_HEIGHT, 2)}px`,
                  background: CHART_COLORS.completed,
                }}
              />
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="flex gap-3">
        {recent.map((cycle) => (
          <span
            key={cycle.id}
            className="max-w-6 flex-1 truncate text-center text-micro text-text-tertiary [font-variant-numeric:tabular-nums]"
          >
            {cycle.number}
          </span>
        ))}
      </div>
    </section>
  );
}
