"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import type { Cycle, CycleSnapshot } from "@/lib/data/cycles";
import { buildBurnupSeries, type BurnupPoint } from "@/lib/board/cycle-metrics";
import { parseIsoDate } from "@/lib/board/cycle-status";
import {
  CHART_AREA_OPACITY,
  CHART_COLORS,
  CHART_LINE_WIDTH,
  CHART_MARKER_RADIUS,
} from "@/lib/board/chart-tokens";
import { cn } from "@/lib/utils";

const HEIGHT = 208;
const PAD = { top: 12, right: 14, bottom: 22, left: 30 };

interface PlotPoint {
  x: number;
  y: number | null;
}

/** Boş (null) günleri atlayarak kesintili çizgi path'i üretir. */
function linePath(points: PlotPoint[]): string {
  let path = "";
  let penDown = false;
  for (const point of points) {
    if (point.y === null) {
      penDown = false;
      continue;
    }
    path += `${penDown ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)} `;
    penDown = true;
  }
  return path.trim();
}

/** Çizginin altını tabana kadar dolduran alan path'i (yalnızca dolu aralık). */
function areaPath(points: PlotPoint[], baselineY: number): string {
  const filled = points.filter((point): point is { x: number; y: number } => point.y !== null);
  if (filled.length < 2) return "";
  const top = filled.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
  const last = filled[filled.length - 1];
  const first = filled[0];
  return `${top.join(" ")} L${last.x.toFixed(1)} ${baselineY} L${first.x.toFixed(1)} ${baselineY} Z`;
}

function niceTicks(max: number): number[] {
  const ceiling = Math.max(1, Math.ceil(max));
  const step = Math.max(1, Math.ceil(ceiling / 4));
  const ticks: number[] = [];
  for (let value = 0; value <= ceiling; value += step) ticks.push(value);
  if (ticks[ticks.length - 1] < ceiling) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export interface CycleBurnupChartProps {
  cycle: Pick<Cycle, "startsAt" | "endsAt" | "totalIssues">;
  snapshots: CycleSnapshot[];
  todayIso: string;
  className?: string;
}

export function CycleBurnupChart({ cycle, snapshots, todayIso, className }: CycleBurnupChartProps) {
  const { t, locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const series = useMemo(
    () => buildBurnupSeries(cycle, snapshots, todayIso),
    [cycle, snapshots, todayIso],
  );

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

  const innerWidth = Math.max(0, width - PAD.left - PAD.right);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const baselineY = PAD.top + innerHeight;

  const ticks = useMemo(() => {
    const values = series.flatMap((point) => [point.scope ?? 0, point.target, point.started ?? 0]);
    return niceTicks(Math.max(...values, 1));
  }, [series]);
  const yMax = ticks[ticks.length - 1];

  const x = (index: number) =>
    PAD.left + (series.length <= 1 ? innerWidth / 2 : (index / (series.length - 1)) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight - (value / yMax) * innerHeight;

  const toPoints = (pick: (point: BurnupPoint) => number | null): PlotPoint[] =>
    series.map((point, index) => {
      const value = pick(point);
      return { x: x(index), y: value === null ? null : y(value) };
    });

  const scopePoints = toPoints((point) => point.scope);
  const startedPoints = toPoints((point) => point.started);
  const completedPoints = toPoints((point) => point.completed);
  const targetPoints = toPoints((point) => point.target);

  const lastCompleted = [...completedPoints].reverse().find((point) => point.y !== null);
  const hasActuals = completedPoints.some((point) => point.y !== null);
  const hovered = hoverIndex === null ? null : series[hoverIndex];

  const xLabelIndexes = useMemo(() => {
    if (series.length <= 2) return series.map((_, index) => index);
    return [0, Math.floor((series.length - 1) / 2), series.length - 1];
  }, [series]);

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (innerWidth <= 0 || series.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const index = Math.round(ratio * (series.length - 1));
    setHoverIndex(Math.min(series.length - 1, Math.max(0, index)));
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div ref={containerRef} className="relative w-full">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={t("cycles.chart.ariaLabel")}
            className="block"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--color-border-default)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-tertiary text-[10px] [font-variant-numeric:tabular-nums]"
                >
                  {tick}
                </text>
              </g>
            ))}

            {xLabelIndexes.map((index) => (
              <text
                key={index}
                x={x(index)}
                y={HEIGHT - 6}
                textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}
                className="fill-text-tertiary text-[10px]"
              >
                {dayFormatter.format(parseIsoDate(series[index].date))}
              </text>
            ))}

            {/* Hedef — nötr gri, kesikli: kimlik rengi taşımayan bir referans çizgisi */}
            <path
              d={linePath(targetPoints)}
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth={CHART_LINE_WIDTH}
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />

            {/* Scope — nötr gri düz referans çizgisi */}
            <path
              d={linePath(scopePoints)}
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth={CHART_LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Başlatılan — tamamlananın üstüne yığılmış (Linear'daki gibi) */}
            <path
              d={linePath(startedPoints)}
              fill="none"
              stroke={CHART_COLORS.started}
              strokeWidth={CHART_LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path d={areaPath(completedPoints, baselineY)} fill={CHART_COLORS.completed} opacity={CHART_AREA_OPACITY} />
            <path
              d={linePath(completedPoints)}
              fill="none"
              stroke={CHART_COLORS.completed}
              strokeWidth={CHART_LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {lastCompleted?.y !== undefined && lastCompleted?.y !== null && (
              <circle
                cx={lastCompleted.x}
                cy={lastCompleted.y}
                r={CHART_MARKER_RADIUS}
                fill={CHART_COLORS.completed}
                stroke="var(--color-bg-app)"
                strokeWidth={2}
              />
            )}

            {hoverIndex !== null && (
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={PAD.top}
                y2={baselineY}
                stroke="var(--color-text-tertiary)"
                strokeWidth={1}
              />
            )}

            <rect
              x={PAD.left}
              y={PAD.top}
              width={Math.max(0, innerWidth)}
              height={innerHeight}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>
        )}

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-lg border border-border-default bg-bg-popover p-2 shadow-dropdown-2"
            style={{
              left: Math.min(Math.max(x(hoverIndex ?? 0), 72), Math.max(width - 72, 72)),
            }}
          >
            <p className="mb-1 text-micro text-text-tertiary">
              {dayFormatter.format(parseIsoDate(hovered.date))}
            </p>
            <TooltipRow
              color={CHART_COLORS.completed}
              label={t("cycles.chart.completed")}
              value={hovered.completed}
            />
            <TooltipRow
              color={CHART_COLORS.started}
              label={t("cycles.chart.started")}
              value={hovered.started}
            />
            <TooltipRow
              neutral
              label={t("cycles.chart.scope")}
              value={hovered.scope}
            />
            <TooltipRow
              neutral
              dashed
              label={t("cycles.chart.target")}
              value={Math.round(hovered.target * 10) / 10}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[30px]">
        <LegendItem color={CHART_COLORS.completed} label={t("cycles.chart.completed")} />
        <LegendItem color={CHART_COLORS.started} label={t("cycles.chart.started")} />
        <LegendItem neutral label={t("cycles.chart.scope")} />
        <LegendItem neutral dashed label={t("cycles.chart.target")} />
        {!hasActuals && (
          <span className="text-micro text-text-tertiary">· {t("cycles.chart.noData")}</span>
        )}
      </div>
    </div>
  );
}

function LineKey({ color, neutral, dashed }: { color?: string; neutral?: boolean; dashed?: boolean }) {
  return (
    <svg width={14} height={8} aria-hidden className="shrink-0">
      <line
        x1={0}
        x2={14}
        y1={4}
        y2={4}
        stroke={neutral ? "var(--color-text-tertiary)" : color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={dashed ? "3 3" : undefined}
        opacity={dashed ? 0.55 : 1}
      />
    </svg>
  );
}

function LegendItem({
  color,
  label,
  neutral,
  dashed,
}: {
  color?: string;
  label: string;
  neutral?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-micro text-text-tertiary">
      <LineKey color={color} neutral={neutral} dashed={dashed} />
      {label}
    </span>
  );
}

function TooltipRow({
  color,
  label,
  value,
  neutral,
  dashed,
}: {
  color?: string;
  label: string;
  value: number | null;
  neutral?: boolean;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <LineKey color={color} neutral={neutral} dashed={dashed} />
      <span className="text-mini font-medium text-text-primary [font-variant-numeric:tabular-nums]">
        {value ?? "—"}
      </span>
      <span className="text-micro text-text-tertiary">{label}</span>
    </div>
  );
}
