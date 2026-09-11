"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ProjectIcon } from "@/components/app-shell/project-icon";
import { useLocale } from "@/components/locale-provider";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { updateCycleDuration } from "@/lib/actions/cycles";
import type { Project } from "@/lib/data/projects";

const DURATION_WEEK_OPTIONS = [1, 2, 3, 4];

export interface CycleSettingsProps {
  projects: Project[];
}

/** Cycle süresi daha önce `/cycles` üst çubuğunda gizliydi; ayarlar bunu proje başına tek yerde topluyor. */
export function CycleSettings({ projects: initialProjects }: CycleSettingsProps) {
  const { t } = useLocale();
  const [projects, setProjects] = useState(initialProjects);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleChange(project: Project, weeks: string) {
    const days = Number(weeks) * 7;
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, cycleDurationDays: days } : p)),
    );
    setSavingId(project.id);
    const result = await updateCycleDuration(project.id, days);
    setSavingId(null);
    if (!result.ok) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      toast.error(t("cycles.durationUpdateError"));
    }
  }

  return (
    <SettingsPage title={t("settings.cycles.title")} description={t("settings.cycles.description")}>
      <SettingsSection title={t("settings.cycles.duration.label")}>
        {projects.map((project) => (
          <SettingsRow
            key={project.id}
            label={project.name}
            description={project.prefix}
            leading={<ProjectIcon project={project} className="size-5 text-micro" />}
            control={
              <Select
                value={String(project.cycleDurationDays / 7)}
                onValueChange={(weeks) => void handleChange(project, weeks)}
                disabled={savingId === project.id}
              >
                <SelectTrigger aria-label={`${project.name} — ${t("settings.cycles.duration.label")}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_WEEK_OPTIONS.map((weeks) => (
                    <SelectItem key={weeks} value={String(weeks)}>
                      {weeks} {t("cycles.duration.weeksUnit")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        ))}
      </SettingsSection>
    </SettingsPage>
  );
}
