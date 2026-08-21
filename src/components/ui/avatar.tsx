"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "size-6 text-micro",
        md: "size-8 text-mini",
        lg: "size-10 text-small",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const LABEL_COLORS = [
  "bg-label-teal/20 text-label-teal",
  "bg-label-red/20 text-label-red",
  "bg-label-orange/20 text-label-orange",
  "bg-label-purple/20 text-label-purple",
  "bg-label-blue/20 text-label-blue",
  "bg-label-green/20 text-label-green",
];

function colorForName(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2);
  return (initials ?? "?").toUpperCase();
}

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  name: string;
  className?: string;
}

export function Avatar({ src, name, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)}>
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center font-medium",
          colorForName(name),
        )}
        delayMs={src ? 400 : 0}
      >
        {initialsForName(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
