"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuContentClass, menuItemClass, menuSeparatorClass } from "@/components/ui/menu-shared";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuSeparator = ({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuSeparatorProps) => (
  <DropdownMenuPrimitive.Separator className={menuSeparatorClass(className)} {...props} />
);

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={menuContentClass(className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps
  extends DropdownMenuPrimitive.DropdownMenuItemProps {
  variant?: "default" | "destructive";
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item className={menuItemClass(variant, className)} {...props} />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-small text-text-primary outline-none transition-colors",
        "data-[highlighted]:bg-bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="relative flex-1">{children}</span>
      <DropdownMenuPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <Check className="size-3.5 text-accent" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
