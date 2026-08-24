"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  FolderKanban,
  Inbox,
  Layers,
  ListTodo,
  RotateCw,
  Settings,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

interface NavCommand {
  label: string;
  href: Route;
  icon: typeof Inbox;
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useAppShell();
  const { t } = useLocale();
  const router = useRouter();

  function go(href: Route) {
    router.push(href);
    setCommandOpen(false);
  }

  const workspaceCommands: NavCommand[] = [
    { label: t("nav.inbox"), href: "/inbox", icon: Inbox },
    { label: t("nav.myIssues"), href: "/my-issues", icon: ListTodo },
    { label: t("nav.projects"), href: "/projects", icon: FolderKanban },
    { label: t("nav.views"), href: "/views", icon: Layers },
    { label: t("common.settings"), href: "/settings", icon: Settings },
  ];

  const teamCommands: NavCommand[] = [
    {
      label: `${DEFAULT_TEAM.name} · ${t("nav.issues")}`,
      href: `/team/${DEFAULT_TEAM.slug}/issues`,
      icon: ListTodo,
    },
    {
      label: `${DEFAULT_TEAM.name} · ${t("nav.cycles")}`,
      href: `/team/${DEFAULT_TEAM.slug}/cycles`,
      icon: RotateCw,
    },
    {
      label: `${DEFAULT_TEAM.name} · ${t("nav.views")}`,
      href: `/team/${DEFAULT_TEAM.slug}/views`,
      icon: Layers,
    },
  ];

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder={t("commandPalette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("commandPalette.noResults")}</CommandEmpty>
        <CommandGroup heading={t("nav.section.workspace")}>
          {workspaceCommands.map((cmd) => (
            <CommandItem key={cmd.href} value={cmd.label} onSelect={() => go(cmd.href)}>
              <cmd.icon className="size-3.5 text-text-tertiary" />
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t("commandPalette.group.teams")}>
          {teamCommands.map((cmd) => (
            <CommandItem key={cmd.href} value={cmd.label} onSelect={() => go(cmd.href)}>
              <cmd.icon className="size-3.5 text-text-tertiary" />
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
