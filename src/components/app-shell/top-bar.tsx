"use client";

import { ListFilter, PanelLeft, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";

export type TopBarView = "list" | "board";

export interface TopBarProps {
  title: string;
  breadcrumb?: string;
  view?: TopBarView;
  onViewChange?: (view: TopBarView) => void;
  primaryActionLabel?: string;
}

export function TopBar({ title, breadcrumb, view, onViewChange, primaryActionLabel }: TopBarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppShell();
  const { t } = useLocale();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-default px-4">
      <div className="flex items-center gap-2">
        {sidebarCollapsed && (
          <Tooltip content={t("topbar.expandToggle.label")}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("topbar.expandToggle.label")}
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
        {view && onViewChange && (
          <Tabs value={view} onValueChange={(v) => onViewChange(v as TopBarView)}>
            <TabsList>
              <TabsTrigger value="list">{t("topbar.tab.list")}</TabsTrigger>
              <TabsTrigger value="board">{t("topbar.tab.board")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Tooltip content={t("topbar.filter.label")}>
          <Button variant="ghost" size="icon" aria-label={t("topbar.filter.label")}>
            <ListFilter className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip content={t("topbar.viewOptions.label")}>
          <Button variant="ghost" size="icon" aria-label={t("topbar.viewOptions.label")}>
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
