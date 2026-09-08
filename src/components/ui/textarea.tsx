import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "w-full rounded-md border bg-bg-surface text-text-primary placeholder:text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      textareaSize: {
        sm: "min-h-16 px-2 py-1.5 text-mini",
        md: "min-h-20 px-3 py-2 text-small",
        lg: "min-h-28 px-3.5 py-2.5 text-normal",
      },
      invalid: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-border-default",
      },
    },
    defaultVariants: {
      textareaSize: "md",
      invalid: false,
    },
  },
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, textareaSize, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ textareaSize, invalid }), className)}
      {...props}
    />
  );
});
