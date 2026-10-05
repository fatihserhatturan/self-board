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
import { useModules } from "@/components/modules-provider";

interface NavCommand {
  label: string;
  href: Route;
  icon: LucideIcon;
}

export function CommandPalette() {
  const {
    commandOpen,
    setCommandOpen,
    issueIndex,
    moduleSearchEntries,
    projects,
    activeProjectId,
    setActiveProjectId,
  } = useAppShell();
  const { enabledModules } = useModules();
  const { t } = useLocale();
  const router = useRouter();

  function go(href: Route) {
    router.push(href);
    setCommandOpen(false);
  }

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  const workspaceCommands: NavCommand[] = [
    { label: t("nav.myIssues"), href: "/my-issues", icon: ListTodo },
    { label: t("nav.issues"), href: `/issues?project=${activeProjectId ?? ""}`, icon: ListTodo },
    { label: t("nav.projects"), href: "/projects", icon: FolderKanban },
    { label: t("nav.views"), href: `/views?project=${activeProjectId ?? ""}`, icon: Layers },
    { label: t("nav.cycles"), href: `/cycles?project=${activeProjectId ?? ""}`, icon: RotateCw },
    // Açık modüllerin sayfaları — sidebar'daki modül bölümüyle aynı.
    ...enabledModules.map((module) => ({
      label: t(module.nav.labelKey),
      href:
        module.scope === "per-project"
          ? (`${module.nav.href}?project=${activeProjectId ?? ""}` as Route)
          : module.nav.href,
      icon: module.icon,
    })),
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
        {/* Modül içerikleri (ör. wiki sayfaları), modül başına bir grup. Kayıtları
            sunucu üretiyor (`lib/modules/server.ts`); palet modül adını bilmiyor. */}
        {enabledModules.map((module) => {
          const entries = moduleSearchEntries.filter((entry) => entry.moduleId === module.id);
          if (entries.length === 0) return null;
          return (
            <CommandGroup key={module.id} heading={t(module.nameKey)}>
              {entries.map((entry) => {
                const title = entry.title || t("common.untitled");
                const projectName = entry.projectId ? projectNames.get(entry.projectId) : undefined;
                return (
                  <CommandItem
                    key={`${module.id}-${entry.id}`}
                    value={`${module.id}-${entry.id}`}
                    keywords={projectName ? [title, projectName] : [title]}
                    onSelect={() => {
                      if (entry.projectId) setActiveProjectId(entry.projectId);
                      go(entry.href);
                    }}
                  >
                    <module.icon className="size-3.5 shrink-0 text-text-tertiary" />
                    <span className="truncate">{title}</span>
                    {projectName && (
                      <span className="ml-auto shrink-0 text-mini text-text-tertiary">{projectName}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
