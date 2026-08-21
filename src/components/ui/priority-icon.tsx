import { Minus, Signal, SignalHigh, SignalLow, SignalMedium, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PriorityLevel = "no-priority" | "urgent" | "high" | "medium" | "low";

const priorityIconMap: Record<PriorityLevel, LucideIcon> = {
  "no-priority": Minus,
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  // Linear's real "urgent" glyph is a distinct custom icon, not a signal bar —
  // this is the closest lucide approximation (see design-system TODO note).
  urgent: Signal,
};

const priorityColorMap: Record<PriorityLevel, string> = {
  "no-priority": "text-text-tertiary",
  low: "text-text-secondary",
  medium: "text-text-secondary",
  high: "text-text-primary",
  urgent: "text-label-red",
};

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
} as const;

export interface PriorityIconProps {
  level: PriorityLevel;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function PriorityIcon({ level, size = "md", className }: PriorityIconProps) {
  const Icon = priorityIconMap[level];
  return <Icon className={cn(sizeMap[size], priorityColorMap[level], className)} />;
}
