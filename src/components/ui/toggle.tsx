"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-small font-medium text-text-secondary transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-bg-muted hover:text-text-primary",
        outline: "border border-border-default hover:bg-bg-muted hover:text-text-primary",
      },
      size: {
        sm: "h-7 px-2",
        md: "h-8 px-2.5",
        lg: "h-10 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ToggleProps
  extends TogglePrimitive.ToggleProps,
    VariantProps<typeof toggleVariants> {}

export function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={cn(
        toggleVariants({ variant, size }),
        "data-[state=on]:bg-accent-subtle-bg data-[state=on]:text-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
