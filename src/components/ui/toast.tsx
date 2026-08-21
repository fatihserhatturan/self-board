"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, toast } from "sonner";
import { useMounted } from "@/lib/use-mounted";

const toasterVars = {
  "--normal-bg": "var(--color-bg-surface)",
  "--normal-border": "var(--color-border-default)",
  "--normal-text": "var(--color-text-primary)",
  "--success-bg": "var(--color-bg-surface)",
  "--success-border": "color-mix(in srgb, var(--color-label-green) 35%, transparent)",
  "--success-text": "var(--color-label-green)",
  "--warning-bg": "var(--color-bg-surface)",
  "--warning-border": "color-mix(in srgb, var(--color-label-yellow) 35%, transparent)",
  "--warning-text": "var(--color-label-yellow)",
  "--error-bg": "var(--color-bg-surface)",
  "--error-border": "color-mix(in srgb, var(--color-destructive) 35%, transparent)",
  "--error-text": "var(--color-destructive)",
} as CSSProperties;

export function Toaster() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <SonnerToaster
      theme={mounted && resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-right"
      richColors
      style={toasterVars}
      toastOptions={{
        classNames: {
          actionButton: "group-[.toast]:bg-accent group-[.toast]:text-text-on-accent",
          cancelButton: "group-[.toast]:bg-bg-muted group-[.toast]:text-text-secondary",
        },
      }}
    />
  );
}

export { toast };
