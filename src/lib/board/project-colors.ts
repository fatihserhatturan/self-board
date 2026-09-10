import type { LabelColor } from "@/lib/actions/labels";

export const PROJECT_COLORS: LabelColor[] = [
  "teal",
  "red",
  "mustard",
  "yellow",
  "orange",
  "purple",
  "blue",
  "grey",
  "green",
];

export const PROJECT_COLOR_DOT_CLASS: Record<LabelColor, string> = {
  teal: "bg-label-teal",
  red: "bg-label-red",
  mustard: "bg-label-mustard",
  yellow: "bg-label-yellow",
  orange: "bg-label-orange",
  purple: "bg-label-purple",
  blue: "bg-label-blue",
  grey: "bg-label-grey",
  green: "bg-label-green",
};
