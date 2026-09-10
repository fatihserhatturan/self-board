import { cn } from "@/lib/utils";

export interface CycleStatTile {
  label: string;
  value: number | string;
}

/**
 * KPI kartları — dataviz "stat tile" sözleşmesi: etiket cümle düzeninde,
 * değer yarı-kalın ve orantılı rakamlarla (tabular-nums yalnızca hizalanması
 * gereken sütunlar için).
 */
export function CycleStatTiles({ tiles, className }: { tiles: CycleStatTile[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3", className)}>
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-0.5">
          <span className="text-micro text-text-tertiary">{tile.label}</span>
          <span className="text-large-medium text-text-primary">{tile.value}</span>
        </div>
      ))}
    </div>
  );
}
