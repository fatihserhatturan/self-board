"use client";

import { ListFilter, PanelLeft, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useAppShell } from "@/components/app-shell/app-shell-provider";

export interface TopBarProps {
  title: string;
  breadcrumb?: string;
  viewSwitcher?: boolean;
  primaryActionLabel?: string;
}

export function TopBar({ title, breadcrumb, viewSwitcher, primaryActionLabel }: TopBarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppShell();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-default px-4">
      <div className="flex items-center gap-2">
        {sidebarCollapsed && (
          <Tooltip content="Kenar çubuğunu genişlet">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Kenar çubuğunu genişlet"
              onClick={toggleSidebar}
            >
              <PanelLeft className="size-3.5" />
            </Button>
          </Tooltip>
        )}
        <span className="text-small font-medium text-text-primary">
          {breadcrumb && <span className="text-text-tertiary">{breadcrumb} / </span>}
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {viewSwitcher && (
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="board">Pano</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Tooltip content="Filtrele">
          <Button variant="ghost" size="icon" aria-label="Filtrele">
            <ListFilter className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip content="Görünüm seçenekleri">
          <Button variant="ghost" size="icon" aria-label="Görünüm seçenekleri">
            <SlidersHorizontal className="size-3.5" />
          </Button>
        </Tooltip>
        {primaryActionLabel && (
          <Button size="sm">
            <Plus className="size-3.5" />
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </header>
  );
}
