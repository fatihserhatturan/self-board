"use client";

import { useLocale } from "@/components/locale-provider";
import type { CycleStatusCounts } from "@/lib/data/cycles";
import { CHART_COLORS } from "@/lib/board/chart-tokens";
import type { TranslationKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

/**
 * Durum kırılımı — yığılmış çubuk. Segmentler arasındaki 2px yüzey boşluğu
 * (flex gap) ayırıcı görevi görüyor; dataviz kuralı gereği segmentlerin
 * etrafına çerçeve çizilmiyor. `canceled` düşük kroma nötr olduğu için
 * ikincil kodlama olarak 45° tarama deseni taşıyor.
 */
const SEGMENTS: {
  key: keyof CycleStatusCounts;
  labelKey: TranslationKey;
  color: string;
  hatched?: boolean;
}[] = [
  { key: "done", labelKey: "board.status.done", color: CHART_COLORS.completed },
  { key: "inProgress", labelKey: "board.status.in-progress", color: CHART_COLORS.started },
  { key: "todo", labelKey: "board.status.todo", color: CHART_COLORS.todo },
  { key: "backlog", labelKey: "board.status.backlog", color: "var(--color-text-tertiary)" },
  { key: "canceled", labelKey: "board.status.canceled", color: "var(--color-text-tertiary)", hatched: true },
];

const HATCH_BACKGROUND =
  "repeating-linear-gradient(45deg, var(--color-text-tertiary) 0 3px, transparent 3px 6px)";

export interface CycleStatusBarProps {
  counts: CycleStatusCounts;
  className?: string;
}

export function CycleStatusBar({ counts, className }: CycleStatusBarProps) {
  const { t } = useLocale();
  const total = SEGMENTS.reduce((sum, segment) => sum + counts[segment.key], 0);
  const visible = SEGMENTS.filter((segment) => counts[segment.key] > 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
        {total === 0 ? (
          <div className="h-full w-full rounded-full bg-bg-muted" />
        ) : (
          visible.map((segment) => (
            <div
              key={segment.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(counts[segment.key] / total) * 100}%`,
                background: segment.hatched ? HATCH_BACKGROUND : segment.color,
                opacity: segment.hatched ? 0.7 : 1,
              }}
            />
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {visible.map((segment) => (
          <span key={segment.key} className="flex items-center gap-1.5 text-micro text-text-tertiary">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                background: segment.hatched ? HATCH_BACKGROUND : segment.color,
                opacity: segment.hatched ? 0.7 : 1,
              }}
            />
            <span className="font-medium text-text-secondary [font-variant-numeric:tabular-nums]">
              {counts[segment.key]}
            </span>
            {t(segment.labelKey)}
          </span>
        ))}
      </div>
    </div>
  );
}
