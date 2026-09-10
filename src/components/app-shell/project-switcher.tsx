"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectIcon } from "@/components/app-shell/project-icon";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";

export function ProjectSwitcher() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { projects, activeProjectId, setActiveProjectId } = useAppShell();

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  function handleSelect(projectId: string) {
    setActiveProjectId(projectId);
    router.push(`${pathname}?project=${projectId}`);
  }

  if (!activeProject) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-small text-text-secondary transition-colors hover:bg-bg-muted">
        <ProjectIcon project={activeProject} className="size-5 text-micro" />
        <span className="flex-1 truncate text-left">{activeProject.name}</span>
        <ChevronDown className="size-3.5 shrink-0 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {projects.map((project) => (
          <DropdownMenuCheckboxItem
            key={project.id}
            checked={project.id === activeProject.id}
            onCheckedChange={() => handleSelect(project.id)}
          >
            <span className="flex items-center gap-2">
              <ProjectIcon project={project} className="size-4 text-mini" />
              {project.name}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects">
            <Settings className="size-3.5" /> {t("projectSwitcher.manageAction")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
