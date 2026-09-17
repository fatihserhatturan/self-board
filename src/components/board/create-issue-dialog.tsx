"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { usePreferences } from "@/components/preferences-provider";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { ProjectIcon } from "@/components/app-shell/project-icon";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { createIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import type { Project } from "@/lib/data/projects";
import type { WorkflowState } from "@/lib/board/workflow-config";
import type { Preferences } from "@/lib/preferences-config";

/** Tercih somut bir durum değil sistem tipi tutuyor (durumlar proje başına); o tipteki ilk durum, yoksa projenin ilki. */
function preferredStateId(preferences: Preferences, states: WorkflowState[]): string {
  const preferred =
    states.find((state) => state.type === preferences.defaultIssueStateType) ?? states[0];
  return preferred?.id ?? "";
}

/**
 * Formun açılış değerleri. Durum ve öncelik artık sabit değil, Ayarlar >
 * Tercihler altından geliyor. Atanan için sıra: çağıranın açıkça verdiği değer
 * (ör. My Issues sayfası), yoksa "issue'ları bana ata" tercihi, yoksa boş.
 */
function buildDefaultValues(
  preferences: Preferences,
  states: WorkflowState[],
  currentUserId: string | null,
  defaultAssigneeId?: string | null,
  defaultCycleId?: string | null,
): IssueFormValues {
  const autoAssigned = preferences.autoAssignToMe ? currentUserId : null;
  return {
    title: "",
    description: "",
    stateId: preferredStateId(preferences, states),
    priority: preferences.defaultIssuePriority,
    assigneeId: defaultAssigneeId ?? autoAssigned,
    cycleId: defaultCycleId ?? null,
    labelIds: [],
  };
}

export interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  users: Person[];
  labels: IssueLabel[];
  cycles: Cycle[];
  /** `projectId`'nin durumları. Sonradan (asenkron) gelebilir; gelene kadar oluşturma kapalı. */
  states: WorkflowState[];
  defaultAssigneeId?: string | null;
  defaultCycleId?: string | null;
  /**
   * Verilirse formda proje seçici gösterilir (global dialog, My Issues). Seçim
   * değişince çağıran `projectId`, `states` ve `cycles`'ı yeni projeye göre verir.
   */
  projects?: Project[];
  onProjectIdChange?: (projectId: string) => void;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  projectId,
  users,
  labels,
  cycles,
  states,
  defaultAssigneeId,
  defaultCycleId,
  projects,
  onProjectIdChange,
}: CreateIssueDialogProps) {
  const { t } = useLocale();
  const router = useRouter();
  const preferences = usePreferences();
  const { currentUserId } = useAppShell();
  const [values, setValues] = useState<IssueFormValues>(() =>
    buildDefaultValues(preferences, states, currentUserId, defaultAssigneeId, defaultCycleId),
  );
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  // Sunucu yeniden render'ı bitmeden dialog kapanırsa kullanıcı bir an bayat
  // listeye bakıyor; `isPending` boyunca buton yükleniyor durumunda tutuluyor.
  const [isPending, startTransition] = useTransition();
  const [wasOpen, setWasOpen] = useState(open);
  const [prevDefaultCycleId, setPrevDefaultCycleId] = useState(defaultCycleId ?? null);
  const [prevProjectId, setPrevProjectId] = useState(projectId);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(buildDefaultValues(preferences, states, currentUserId, defaultAssigneeId, defaultCycleId));
      setTitleError(undefined);
    }
  }

  // Proje değişince önceki projenin durumu ve cycle'ı geçersiz; başlık,
  // açıklama, atanan ve etiketler (projeler arası ortak) korunuyor.
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setValues((current) => ({ ...current, stateId: preferredStateId(preferences, states), cycleId: null }));
  }

  // Durumlar dialog açıldıktan sonra yüklenebiliyor (global dialog). Önceden
  // varsayılan durum yalnızca açılış anında hesaplanıyordu; liste sonradan
  // gelince `stateId` boş kalıyor ve issue durumsuz kaydedilmeye çalışılıyordu.
  if (open && states.length > 0 && !states.some((state) => state.id === values.stateId)) {
    setValues({ ...values, stateId: preferredStateId(preferences, states) });
  }

  // Global dialog cycle'ları açıldıktan sonra yüklüyor; varsayılan cycle
  // dialog açıkken gelirse kullanıcı henüz seçim yapmamışsa uygulanır.
  if ((defaultCycleId ?? null) !== prevDefaultCycleId) {
    setPrevDefaultCycleId(defaultCycleId ?? null);
    if (open && defaultCycleId && values.cycleId === null) {
      setValues({ ...values, cycleId: defaultCycleId });
    }
  }

  const stateReady = states.some((state) => state.id === values.stateId);

  async function handleSubmit() {
    if (!values.title.trim()) {
      setTitleError(t("issueForm.title.required"));
      return;
    }
    if (!stateReady) return;
    setSubmitting(true);
    try {
      const result = await createIssue(projectId, values);
      if (!result.ok) {
        toast.error(t("toast.issue.createError"));
        return;
      }
    } catch {
      toast.error(t("toast.issue.createError"));
      return;
    } finally {
      setSubmitting(false);
    }
    toast.success(t("toast.issue.created"));
    startTransition(() => {
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        className="flex h-[85vh] flex-col overflow-hidden"
        // Cmd/Ctrl+Enter ile oluştur — editörden çıkmadan kaydedebilmek için.
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      >
        <DialogTitle className="shrink-0">{t("common.newIssue")}</DialogTitle>
        <ScrollArea className="mt-4 min-h-0 flex-1">
          <div className="flex flex-col gap-4 px-3">
            {projects && onProjectIdChange && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("issueForm.project.label")}</Label>
                <Select value={projectId} onValueChange={onProjectIdChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="flex items-center gap-2">
                          <ProjectIcon project={project} className="size-4 text-mini" />
                          {project.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <IssueDialogForm
              values={values}
              onChange={setValues}
              users={users}
              labels={labels}
              cycles={cycles}
              states={states}
              titleError={titleError}
            />
          </div>
        </ScrollArea>
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border-default pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting || isPending}
            disabled={!stateReady}
          >
            {t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
