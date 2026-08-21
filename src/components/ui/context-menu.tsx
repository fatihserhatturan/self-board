"use client";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { menuContentClass, menuItemClass, menuSeparatorClass } from "@/components/ui/menu-shared";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuSeparator = ({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuSeparatorProps) => (
  <ContextMenuPrimitive.Separator className={menuSeparatorClass(className)} {...props} />
);

export function ContextMenuContent({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content className={menuContentClass(className)} {...props} />
    </ContextMenuPrimitive.Portal>
  );
}

export interface ContextMenuItemProps extends ContextMenuPrimitive.ContextMenuItemProps {
  variant?: "default" | "destructive";
}

export function ContextMenuItem({
  className,
  variant = "default",
  ...props
}: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item className={menuItemClass(variant, className)} {...props} />
  );
}
