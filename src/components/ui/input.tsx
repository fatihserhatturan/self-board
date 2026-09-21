import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-md border bg-bg-surface text-text-primary placeholder:text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      inputSize: {
        sm: "h-7 px-2 text-mini",
        md: "h-8 px-3 text-small",
        lg: "h-10 px-3.5 text-normal",
      },
      invalid: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-border-default",
      },
    },
    defaultVariants: {
      inputSize: "md",
      invalid: false,
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** React 19'da `ref` sıradan bir prop; `forwardRef` sarmalayıcısına gerek yok. */
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  className,
  inputSize,
  invalid,
  leadingIcon,
  trailingIcon,
  ...props
}: InputProps) {
  if (!leadingIcon && !trailingIcon) {
    return (
      <input
        className={cn(inputVariants({ inputSize, invalid }), className)}
        {...props}
      />
    );
  }

  return (
    <div className="relative flex items-center">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-2.5 flex text-icon-default [&_svg]:size-4">
          {leadingIcon}
        </span>
      )}
      <input
        className={cn(
          inputVariants({ inputSize, invalid }),
          leadingIcon && "pl-8",
          trailingIcon && "pr-8",
          className,
        )}
        {...props}
      />
      {trailingIcon && (
        <span className="pointer-events-none absolute right-2.5 flex text-icon-default [&_svg]:size-4">
          {trailingIcon}
        </span>
      )}
    </div>
  );
}
