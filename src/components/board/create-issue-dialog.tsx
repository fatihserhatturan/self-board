"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { usePreferences } from "@/components/preferences-provider";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { createIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import type { WorkflowState } from "@/lib/board/workflow-config";
import type { Preferences } from "@/lib/preferences-config";

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
  // Tercih somut bir durum değil sistem tipi tutuyor (durumlar proje başına);
  // o tipteki ilk durum seçiliyor, yoksa projenin ilk durumu.
  const preferred =
    states.find((state) => state.type === preferences.defaultIssueStateType) ?? states[0];
  return {
    title: "",
    description: "",
    stateId: preferred?.id ?? "",
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
  states: WorkflowState[];
  defaultAssigneeId?: string | null;
  defaultCycleId?: string | null;
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

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(buildDefaultValues(preferences, states, currentUserId, defaultAssigneeId, defaultCycleId));
      setTitleError(undefined);
    }
  }

  // Global dialog cycle'ları açıldıktan sonra yüklüyor; varsayılan cycle
  // dialog açıkken gelirse kullanıcı henüz seçim yapmamışsa uygulanır.
  if ((defaultCycleId ?? null) !== prevDefaultCycleId) {
    setPrevDefaultCycleId(defaultCycleId ?? null);
    if (open && defaultCycleId && values.cycleId === null) {
      setValues({ ...values, cycleId: defaultCycleId });
    }
  }

  async function handleSubmit() {
    if (!values.title.trim()) {
      setTitleError(t("issueForm.title.required"));
      return;
    }
    setSubmitting(true);
    const result = await createIssue(projectId, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(t("toast.issue.createError"));
      return;
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
          <div className="px-3">
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
          <Button onClick={handleSubmit} loading={submitting || isPending}>
            {t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
