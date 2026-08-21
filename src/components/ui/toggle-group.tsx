"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.ToggleGroupSingleProps | ToggleGroupPrimitive.ToggleGroupMultipleProps) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("inline-flex items-center gap-0.5 rounded-md bg-bg-muted p-0.5", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  ...props
}: ToggleGroupPrimitive.ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 rounded px-2 text-small font-medium text-text-secondary transition-colors",
        "hover:text-text-primary",
        "data-[state=on]:bg-bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-button",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
