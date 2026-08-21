import { cn } from "@/lib/utils";

export const menuContentClass = (className?: string) =>
  cn(
    "z-50 min-w-[10rem] rounded-lg border border-border-default bg-bg-surface p-1 shadow-dropdown-2",
    "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    className,
  );

export const menuItemClass = (
  variant: "default" | "destructive" = "default",
  className?: string,
) =>
  cn(
    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-small outline-none transition-colors",
    "data-[highlighted]:bg-bg-muted",
    variant === "destructive"
      ? "text-destructive data-[highlighted]:text-destructive-hover"
      : "text-text-primary",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className,
  );

export const menuSeparatorClass = (className?: string) =>
  cn("-mx-1 my-1 h-px bg-border-default", className);
