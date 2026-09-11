"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InlineRenameInputProps {
  /** Geçerli ad. `key` olarak da kullanılır: sunucudan gelen değer değişince alan sıfırlanır. */
  value: string;
  onRename: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Odak kaybında kaydeden satır içi yeniden adlandırma alanı. Cycle, proje,
 * görünüm ve etiket listelerinde aynı desen (defaultValue + key + onBlur +
 * Enter ile blur) dört kez kopyalanmıştı.
 */
export function InlineRenameInput({
  value,
  onRename,
  placeholder,
  ariaLabel,
  className,
}: InlineRenameInputProps) {
  return (
    <Input
      key={value}
      defaultValue={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(className)}
      onBlur={(event) => onRename(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.currentTarget.value = value;
          event.currentTarget.blur();
        }
      }}
    />
  );
}
