"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn("flex flex-col overflow-hidden text-text-primary", className)}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border-default px-3">
      <Search className="size-4 shrink-0 text-text-tertiary" />
      <CommandPrimitive.Input
        className={cn(
          "flex h-11 w-full bg-transparent text-small text-text-primary placeholder:text-text-tertiary outline-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <ScrollArea className="max-h-80">
      <CommandPrimitive.List className={cn("overflow-x-hidden p-1", className)} {...props} />
    </ScrollArea>
  );
}

export function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-small text-text-tertiary"
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "text-text-primary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:text-text-tertiary",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border-default", className)} {...props} />
  );
}

export function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-primary outline-none transition-colors",
        "data-[selected=true]:bg-bg-muted",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function CommandDialog({
  children,
  className,
  ...props
}: ComponentProps<typeof Dialog> & { className?: string }) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden bg-bg-command-bar p-0 shadow-command-bar backdrop-blur-xl",
          className,
        )}
      >
        <DialogTitle className="sr-only">Komut Paleti</DialogTitle>
        <DialogDescription className="sr-only">
          Bir komut aramak için yazmaya başlayın
        </DialogDescription>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}
