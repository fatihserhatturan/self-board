import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusState = "backlog" | "todo" | "in-progress" | "done" | "canceled";

const statusIconMap: Record<StatusState, LucideIcon> = {
  backlog: CircleDashed,
  todo: Circle,
  "in-progress": CircleDot,
  done: CircleCheck,
  // Linear's real cancelled state is neutral/grey, not an error state — deliberately
  // not using the destructive red token here.
  canceled: CircleX,
};

const statusColorMap: Record<StatusState, string> = {
  backlog: "text-text-tertiary",
  todo: "text-text-secondary",
  "in-progress": "text-label-yellow",
  done: "text-label-green",
  canceled: "text-text-tertiary",
};

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
} as const;

export interface StatusIconProps {
  state: StatusState;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function StatusIcon({ state, size = "md", className }: StatusIconProps) {
  const Icon = statusIconMap[state];
  return <Icon className={cn(sizeMap[size], statusColorMap[state], className)} />;
}
