"use client";

import { useLocale } from "@/components/locale-provider";
import { capacityRatio } from "@/lib/board/cycle-metrics";
import { CHART_COLORS } from "@/lib/board/chart-tokens";
import { cn } from "@/lib/utils";

export interface CycleCapacityMeterProps {
  plannedScope: number;
  velocity: number;
  className?: string;
}

/**
 * Yaklaşan cycle'lar için kapasite ölçeri: planlanan iş, geçmiş ortalama hıza
 * göre nerede duruyor. Kesikli işaret ortalama hızı gösterir. Kapasite aşımı
 * renk + metin etiketiyle birlikte veriliyor (renk tek başına anlam taşımaz).
 */
export function CycleCapacityMeter({ plannedScope, velocity, className }: CycleCapacityMeterProps) {
  const { t } = useLocale();
  const ratio = capacityRatio(plannedScope, velocity);

  if (ratio === null) {
    return (
      <span className={cn("text-micro text-text-tertiary", className)}>
        {t("cycles.capacity.unknown")}
      </span>
    );
  }

  const over = ratio > 1;
  const axisMax = Math.max(plannedScope, velocity) * 1.25 || 1;

  return (
    <div className={cn("flex min-w-40 flex-col gap-1", className)}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (plannedScope / axisMax) * 100)}%`,
            background: over ? CHART_COLORS.started : "var(--color-accent)",
          }}
        />
        <div
          className="absolute top-0 h-full border-l border-dashed border-text-tertiary"
          style={{ left: `${Math.min(100, (velocity / axisMax) * 100)}%` }}
          aria-hidden
        />
      </div>
      <span className="text-micro text-text-tertiary">
        {over ? t("cycles.capacity.over") : t("cycles.capacity.under")}
      </span>
    </div>
  );
}
