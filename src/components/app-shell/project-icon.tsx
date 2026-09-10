import type { Project } from "@/lib/data/projects";
import { PROJECT_COLOR_DOT_CLASS } from "@/lib/board/project-colors";
import { cn } from "@/lib/utils";

export interface ProjectIconProps {
  project: Pick<Project, "id" | "name" | "color" | "hasIcon">;
  className?: string;
}

export function ProjectIcon({ project, className }: ProjectIconProps) {
  if (project.hasIcon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- küçük, kullanıcı yüklediği bir BLOB; next/image'ın optimizasyonu burada gereksiz.
      <img
        src={`/api/projects/${project.id}/icon`}
        alt=""
        className={cn("shrink-0 rounded object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded font-medium text-text-on-accent",
        PROJECT_COLOR_DOT_CLASS[project.color],
        className,
      )}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}
