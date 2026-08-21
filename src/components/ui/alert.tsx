import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border p-3.5 text-small", {
  variants: {
    variant: {
      info: "border-border-default bg-bg-surface text-text-primary",
      success: "border-label-green/30 bg-label-green/10 text-text-primary",
      warning: "border-label-yellow/30 bg-label-yellow/10 text-text-primary",
      destructive: "border-destructive/30 bg-destructive/10 text-text-primary",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const iconVariants: Record<NonNullable<AlertProps["variant"]>, ReactNode> = {
  info: <Info className="size-4 text-text-secondary" />,
  success: <CheckCircle2 className="size-4 text-label-green" />,
  warning: <AlertTriangle className="size-4 text-label-yellow" />,
  destructive: <XCircle className="size-4 text-destructive" />,
};

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  const resolvedVariant = variant ?? "info";
  return (
    <div className={cn(alertVariants({ variant: resolvedVariant }), className)} {...props}>
      {iconVariants[resolvedVariant]}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-medium text-text-primary">{title}</p>}
        {children && <div className="text-text-secondary">{children}</div>}
      </div>
    </div>
  );
}
