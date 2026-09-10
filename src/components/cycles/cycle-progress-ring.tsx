import { cn } from "@/lib/utils";

export interface CycleProgressRingProps {
  percent: number;
  label: string;
  size?: number;
  className?: string;
}

/**
 * Ölçer (meter): dolgu accent, boş iz aynı rengin daha açık adımı — dataviz
 * skill'inin meter kuralı. Accent bilerek grafik serisi olarak değil sadece
 * ölçerlerde kullanılıyor (bkz. chart-tokens.ts).
 */
export function CycleProgressRing({ percent, label, size = 104, className }: CycleProgressRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={stroke}
            opacity={0.18}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-title2 font-medium text-text-primary">{clamped}%</span>
        </div>
      </div>
      <span className="text-micro text-text-tertiary">{label}</span>
    </div>
  );
}
