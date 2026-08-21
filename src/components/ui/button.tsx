import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-text-on-accent shadow-button hover:bg-accent-hover active:bg-accent-active",
        secondary:
          "bg-bg-muted text-text-primary border border-border-default hover:bg-bg-subtle",
        ghost: "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
        destructive:
          "bg-destructive text-text-on-accent shadow-button hover:bg-destructive-hover hover:shadow-button-destructive",
      },
      size: {
        sm: "h-7 px-2.5 text-mini",
        md: "h-8 px-3",
        lg: "h-10 px-4 text-large",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner size="sm" />}
          {children}
        </>
      )}
    </Comp>
  );
}
