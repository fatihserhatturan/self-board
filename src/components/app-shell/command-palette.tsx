"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { FolderKanban, Layers, ListTodo, RotateCw, Settings, type LucideIcon } from "lucide-react";
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

interface NavCommand {
  label: string;
  href: Route;
  icon: LucideIcon;
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen, issueIndex, activeProjectId, setActiveProjectId } =
    useAppShell();
  const { t } = useLocale();
  const router = useRouter();

  function go(href: Route) {
    router.push(href);
    setCommandOpen(false);
  }

  const workspaceCommands: NavCommand[] = [
    { label: t("nav.myIssues"), href: "/my-issues", icon: ListTodo },
    { label: t("nav.issues"), href: `/issues?project=${activeProjectId ?? ""}`, icon: ListTodo },
    { label: t("nav.projects"), href: "/projects", icon: FolderKanban },
    { label: t("nav.views"), href: `/views?project=${activeProjectId ?? ""}`, icon: Layers },
    { label: t("nav.cycles"), href: `/cycles?project=${activeProjectId ?? ""}`, icon: RotateCw },
    { label: t("common.settings"), href: "/settings", icon: Settings },
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
        <CommandGroup heading={t("commandPalette.group.issues")}>
          {issueIndex.map((issue) => (
            <CommandItem
              key={issue.id}
              value={`${issue.id} ${issue.title}`}
              onSelect={() => {
                setActiveProjectId(issue.projectId);
                go(`/issues?project=${issue.projectId}&open=${issue.id}`);
              }}
            >
              <span className="text-text-tertiary">{issue.id}</span>
              {issue.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
