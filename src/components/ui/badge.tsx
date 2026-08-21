import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium leading-none w-fit",
  {
    variants: {
      color: {
        teal: "bg-label-teal/15 text-label-teal",
        red: "bg-label-red/15 text-label-red",
        mustard: "bg-label-mustard/15 text-label-mustard",
        yellow: "bg-label-yellow/15 text-label-yellow",
        orange: "bg-label-orange/15 text-label-orange",
        purple: "bg-label-purple/15 text-label-purple",
        blue: "bg-label-blue/15 text-label-blue",
        grey: "bg-label-grey/15 text-label-grey",
        green: "bg-label-green/15 text-label-green",
      },
      size: {
        sm: "px-2 py-0.5 text-micro",
        md: "px-2.5 py-1 text-mini",
      },
    },
    defaultVariants: {
      color: "grey",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  withDot?: boolean;
}

export function Badge({
  className,
  color,
  size,
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ color, size }), className)} {...props}>
      {withDot && (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
