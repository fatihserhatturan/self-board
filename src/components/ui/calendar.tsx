"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { tr } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = tr,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-3",
        month_caption:
          "flex items-center justify-center pt-1 text-small font-medium text-text-primary",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous:
          "size-7 inline-flex items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-muted hover:text-text-primary",
        button_next:
          "size-7 inline-flex items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-muted hover:text-text-primary",
        weekday: "size-8 flex items-center justify-center text-micro font-normal text-text-tertiary",
        day: "size-8 p-0 text-center text-small",
        day_button:
          "size-8 rounded-md text-text-primary transition-colors hover:bg-bg-muted",
        selected: "[&>button]:bg-accent [&>button]:text-text-on-accent [&>button]:hover:bg-accent-hover",
        today: "[&>button]:text-accent [&>button]:font-medium",
        outside: "text-text-disabled opacity-50",
        disabled: "text-text-disabled opacity-50 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} />
          ),
      }}
      {...props}
    />
  );
}
