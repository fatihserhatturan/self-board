"use client";

import { ChevronRight, ListTodo, RotateCw, Layers } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarNavItem } from "@/components/app-shell/sidebar-nav-item";
import { useLocale } from "@/components/locale-provider";
import type { Team } from "@/lib/app-shell-data";
import { cn } from "@/lib/utils";

export interface TeamNavGroupProps {
  team: Team;
  defaultOpen?: boolean;
}

export function TeamNavGroup({ team, defaultOpen = true }: TeamNavGroupProps) {
  const { t } = useLocale();

  return (
    <Collapsible defaultOpen={defaultOpen} className="group">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-secondary transition-colors",
          "hover:bg-bg-muted hover:text-text-primary",
        )}
      >
        <ChevronRight className="size-3 shrink-0 text-text-tertiary transition-transform group-data-[state=open]:rotate-90" />
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded text-micro font-medium text-text-on-accent",
            team.color,
          )}
        >
          {team.initial}
        </span>
        <span className="flex-1 truncate text-left">{team.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 pt-0.5">
        <SidebarNavItem
          href={`/team/${team.slug}/issues`}
          icon={ListTodo}
          label={t("nav.issues")}
          indent
        />
        <SidebarNavItem
          href={`/team/${team.slug}/cycles`}
          icon={RotateCw}
          label={t("nav.cycles")}
          indent
        />
        <SidebarNavItem
          href={`/team/${team.slug}/views`}
          icon={Layers}
          label={t("nav.views")}
          indent
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
