"use client";

import type { HTMLAttributes } from "react";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-default bg-bg-muted px-1 font-sans text-micro text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/**
 * Değiştirici tuş etiketi. Uygulama masaüstünde Windows'ta çalışıyor ama her
 * yerde ⌘ basılıyordu. Sunucuda ve ilk boyamada Ctrl gösterilir (varsayılan
 * hedef platform), mount sonrası macOS'ta ⌘'ye geçer — hydration uyuşmazlığı
 * olmadan.
 */
export function ModKey({ className }: { className?: string }) {
  const mounted = useMounted();
  return <Kbd className={className}>{mounted && isMacPlatform() ? "⌘" : "Ctrl"}</Kbd>;
}
