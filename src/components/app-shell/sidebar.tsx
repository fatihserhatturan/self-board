"use client";

import Link from "next/link";
import {
  Layers,
  ListTodo,
  PanelLeftClose,
  Plus,
  RotateCw,
  Search,
  Settings,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/ui/tooltip";
import { ProjectSwitcher } from "@/components/app-shell/project-switcher";
import { SidebarNavItem } from "@/components/app-shell/sidebar-nav-item";
import { WorkspaceSwitcher } from "@/components/app-shell/workspace-switcher";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";
import { WORKSPACE } from "@/lib/app-shell-data";
import type { Person } from "@/lib/data/issues";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  currentUser: Person | null;
}

export function Sidebar({ currentUser }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar, setCommandOpen, setCreateIssueOpen, activeProjectId } =
    useAppShell();
  const { t } = useLocale();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-border-default bg-bg-app transition-all duration-200",
        sidebarCollapsed ? "w-0" : "w-64",
      )}
    >
      <div className={cn("flex h-full w-64 flex-col", sidebarCollapsed && "opacity-0")}>
        <div className="flex flex-col gap-1 p-2">
          <WorkspaceSwitcher workspaceName={WORKSPACE.name} />
          <ProjectSwitcher />

          <Button
            variant="secondary"
            className="w-full justify-start gap-2 font-normal text-text-tertiary"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">{t("sidebar.search.placeholder")}</span>
            <span className="flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start gap-2 font-normal"
            onClick={() => setCreateIssueOpen(true)}
          >
            <Plus className="size-3.5" />
            {t("common.newIssue")}
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 px-2 pb-4">
            <div className="flex flex-col gap-0.5">
              <SidebarNavItem href="/my-issues" icon={ListTodo} label={t("nav.myIssues")} />
            </div>

            <div className="flex flex-col gap-0.5">
              <p className="px-2 pb-1 text-micro font-medium uppercase tracking-wide text-text-tertiary">
                {t("nav.section.workspace")}
              </p>
              <SidebarNavItem
                href={`/issues?project=${activeProjectId ?? ""}`}
                icon={ListTodo}
                label={t("nav.issues")}
              />
              <SidebarNavItem
                href={`/views?project=${activeProjectId ?? ""}`}
                icon={Layers}
                label={t("nav.views")}
              />
              <SidebarNavItem href="/cycles" icon={RotateCw} label={t("nav.cycles")} />
            </div>
          </div>
        </ScrollArea>

        <Divider />

        <div className="flex items-center gap-2 p-2">
          <Avatar name={currentUser?.name ?? ""} size="sm" />
          <span className="flex-1 truncate text-small text-text-primary">
            {currentUser?.name}
          </span>
          <Tooltip content={t("common.settings")}>
            <Button variant="ghost" size="icon" aria-label={t("common.settings")} asChild>
              <Link href="/settings">
                <Settings className="size-3.5" />
              </Link>
            </Button>
          </Tooltip>
          <Tooltip content={t("sidebar.collapseToggle.label")}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("sidebar.collapseToggle.label")}
              onClick={toggleSidebar}
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
