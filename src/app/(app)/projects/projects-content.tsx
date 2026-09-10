"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Pencil, Trash2, X } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ProjectIcon } from "@/components/app-shell/project-icon";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";
import {
  createProject,
  deleteProject,
  removeProjectIcon,
  updateProject,
  updateProjectIcon,
} from "@/lib/actions/projects";
import type { LabelColor } from "@/lib/actions/labels";
import type { Project } from "@/lib/data/projects";
import { PROJECT_COLOR_DOT_CLASS, PROJECT_COLORS } from "@/lib/board/project-colors";

const ICON_ACCEPTED_TYPES = "image/png,image/jpeg,image/gif,image/webp";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ColorSelect({
  value,
  onValueChange,
}: {
  value: LabelColor;
  onValueChange: (color: LabelColor) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as LabelColor)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_COLORS.map((color) => (
          <SelectItem key={color} value={color}>
            <span className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${PROJECT_COLOR_DOT_CLASS[color]}`} />
              {color[0].toUpperCase() + color.slice(1)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface ProjectsContentProps {
  projects: Project[];
}

export function ProjectsContent({ projects: initialProjects }: ProjectsContentProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { setActiveProjectId } = useAppShell();
  const [projects, setProjects] = useState(initialProjects);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("grey");
  const [creating, setCreating] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const iconUploadTargetId = useRef<string | null>(null);

  useEffect(() => {
    if (!confirmingDeleteId) return;
    const timeout = setTimeout(() => setConfirmingDeleteId(null), 3000);
    return () => clearTimeout(timeout);
  }, [confirmingDeleteId]);

  function handleSwitch(project: Project) {
    setActiveProjectId(project.id);
    router.push(`/issues?project=${project.id}`);
  }

  async function handleRename(project: Project, name: string) {
    if (!name.trim() || name === project.name) return;
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, name } : p)));
    const result = await updateProject(project.id, { name, color: project.color });
    if (!result.ok) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      toast.error(t("toast.project.updateError"));
    }
  }

  async function handleColorChange(project: Project, color: LabelColor) {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, color } : p)));
    const result = await updateProject(project.id, { name: project.name, color });
    if (!result.ok) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      toast.error(t("toast.project.updateError"));
    }
  }

  function handleIconClick(project: Project) {
    iconUploadTargetId.current = project.id;
    iconInputRef.current?.click();
  }

  async function handleIconFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const projectId = iconUploadTargetId.current;
    event.target.value = "";
    if (!file || !projectId) return;

    if (!ICON_ACCEPTED_TYPES.split(",").includes(file.type)) {
      toast.error(t("markdownEditor.unsupportedType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("markdownEditor.fileTooLarge"));
      return;
    }

    const base64 = await fileToBase64(file);
    const result = await updateProjectIcon(projectId, base64, file.type);
    if (!result.ok) {
      toast.error(t("toast.project.iconUploadError"));
      return;
    }
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, hasIcon: true } : p)));
  }

  async function handleRemoveIcon(project: Project) {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, hasIcon: false } : p)));
    const result = await removeProjectIcon(project.id);
    if (!result.ok) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      toast.error(t("toast.project.iconUploadError"));
    }
  }

  function handleDeleteClick(project: Project) {
    if (confirmingDeleteId !== project.id) {
      setConfirmingDeleteId(project.id);
      return;
    }
    void handleDelete(project);
  }

  async function handleDelete(project: Project) {
    setConfirmingDeleteId(null);
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    const result = await deleteProject(project.id);
    if (!result.ok) {
      setProjects(previous);
      toast.error(
        result.error === "cannot-delete-last-project"
          ? t("toast.project.cannotDeleteLast")
          : t("toast.project.deleteError"),
      );
      return;
    }
    toast.success(t("toast.project.deleted"));
    router.refresh();
  }

  async function handleCreate() {
    if (!newName.trim() || !newPrefix.trim()) return;
    setCreating(true);
    const result = await createProject({ name: newName, prefix: newPrefix, color: newColor });
    setCreating(false);
    if (!result.ok) {
      toast.error(
        result.error === "prefix-taken"
          ? t("toast.project.prefixTaken")
          : result.error === "prefix-invalid"
            ? t("toast.project.prefixInvalid")
            : t("toast.project.createError"),
      );
      return;
    }
    toast.success(t("toast.project.created"));
    setProjects((prev) => [...prev, result.data]);
    setNewName("");
    setNewPrefix("");
    setNewColor("grey");
  }

  return (
    <>
      <TopBar
        title={t("nav.projects")}
        primaryActionLabel={t("page.projects.newAction")}
        primaryActionDisabled
      />

      <input
        ref={iconInputRef}
        type="file"
        accept={ICON_ACCEPTED_TYPES}
        className="hidden"
        onChange={handleIconFileChange}
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title={t("emptyState.projects.title")} />
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 rounded-lg border border-border-default p-3"
              >
                <div className="group relative shrink-0">
                  <button
                    type="button"
                    onClick={() => handleIconClick(project)}
                    aria-label={t("page.projects.icon.upload")}
                    className="block overflow-hidden rounded"
                  >
                    <ProjectIcon project={project} className="size-6 text-micro" />
                    <span className="absolute inset-0 hidden items-center justify-center rounded bg-black/40 group-hover:flex">
                      <Pencil className="size-3 text-text-on-accent" />
                    </span>
                  </button>
                  {project.hasIcon && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIcon(project)}
                      aria-label={t("page.projects.icon.remove")}
                      className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full border border-border-default bg-bg-app"
                    >
                      <X className="size-2" />
                    </button>
                  )}
                </div>
                <Badge size="sm" color="grey" className="shrink-0 font-mono">
                  {project.prefix}
                </Badge>
                <Input
                  className="flex-1"
                  defaultValue={project.name}
                  key={`${project.id}-${project.name}`}
                  onBlur={(e) => handleRename(project, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <ColorSelect
                  value={project.color}
                  onValueChange={(color) => handleColorChange(project, color)}
                />
                <Button variant="secondary" size="sm" onClick={() => handleSwitch(project)}>
                  {t("page.projects.switchAction")}
                </Button>
                <Button
                  variant={confirmingDeleteId === project.id ? "destructive" : "ghost"}
                  size="icon"
                  aria-label={t("page.projects.delete.label")}
                  onClick={() => handleDeleteClick(project)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Label className="sr-only" htmlFor="new-project-name">
              {t("page.projects.namePlaceholder")}
            </Label>
            <Input
              id="new-project-name"
              className="flex-1"
              placeholder={t("page.projects.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Label className="sr-only" htmlFor="new-project-prefix">
              {t("page.projects.prefixPlaceholder")}
            </Label>
            <Input
              id="new-project-prefix"
              className="w-24 font-mono uppercase"
              placeholder={t("page.projects.prefixPlaceholder")}
              maxLength={5}
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
            />
            <ColorSelect value={newColor} onValueChange={setNewColor} />
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={!newName.trim() || !newPrefix.trim()}
            >
              {t("page.projects.newAction")}
            </Button>
          </div>
          <p className="text-mini text-text-tertiary">{t("page.projects.prefixHint")}</p>
        </div>
      )}
    </>
  );
}
