import type { Cycle } from "@/lib/data/cycles";

/** Özel isim yoksa "Cycle {number}" gösterir — Linear'daki varsayılan cycle adlandırma deseni. */
export function cycleLabel(cycle: Pick<Cycle, "number" | "name">): string {
  return cycle.name?.trim() || `Cycle ${cycle.number}`;
}
