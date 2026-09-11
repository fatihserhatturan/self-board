"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabelColor } from "@/lib/actions/labels";
import { COLOR_DOT_CLASS, SELECTABLE_COLORS } from "@/lib/board/color-tokens";
import { cn } from "@/lib/utils";

export interface ColorSelectProps {
  value: LabelColor;
  onValueChange: (color: LabelColor) => void;
  className?: string;
}

/** Etiket ve proje ayarlarında paylaşılan renk seçici (önceden iki kopyaydı). */
export function ColorSelect({ value, onValueChange, className }: ColorSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as LabelColor)}>
      <SelectTrigger className={cn("w-32", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SELECTABLE_COLORS.map((color) => (
          <SelectItem key={color} value={color}>
            <span className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", COLOR_DOT_CLASS[color])} />
              {color[0].toUpperCase() + color.slice(1)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
