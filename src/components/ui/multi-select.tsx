"use client";

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seç...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.value));

  function toggle(v: string) {
    onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn("w-56 justify-between font-normal", className)}
        >
          <span className={cn("truncate text-left", selected.length === 0 && "text-text-tertiary")}>
            {selected.length > 0 ? selected.map((s) => s.label).join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-text-tertiary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <ScrollArea className="max-h-64">
          <div className="flex flex-col">
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  onClick={() => toggle(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(option.value);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-small text-text-primary outline-none transition-colors hover:bg-bg-muted focus-visible:bg-bg-muted"
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="flex-1 truncate">{option.label}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
