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
import { DEFAULT_TEAM } from "@/lib/app-shell-data";

interface NavCommand {
  label: string;
  href: Route;
  icon: typeof Inbox;
}

const WORKSPACE_COMMANDS: NavCommand[] = [
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "My Issues", href: "/my-issues", icon: ListTodo },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Views", href: "/views", icon: Layers },
  { label: "Settings", href: "/settings", icon: Settings },
];

const TEAM_COMMANDS: NavCommand[] = [
  { label: `${DEFAULT_TEAM.name} · Issues`, href: `/team/${DEFAULT_TEAM.slug}/issues`, icon: ListTodo },
  { label: `${DEFAULT_TEAM.name} · Cycles`, href: `/team/${DEFAULT_TEAM.slug}/cycles`, icon: RotateCw },
  { label: `${DEFAULT_TEAM.name} · Views`, href: `/team/${DEFAULT_TEAM.slug}/views`, icon: Layers },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useAppShell();
  const router = useRouter();

  function go(href: Route) {
    router.push(href);
    setCommandOpen(false);
  }

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Bir komut ara veya sayfaya git..." />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
        <CommandGroup heading="Workspace">
          {WORKSPACE_COMMANDS.map((cmd) => (
            <CommandItem key={cmd.href} value={cmd.label} onSelect={() => go(cmd.href)}>
              <cmd.icon className="size-3.5 text-text-tertiary" />
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Teams">
          {TEAM_COMMANDS.map((cmd) => (
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
