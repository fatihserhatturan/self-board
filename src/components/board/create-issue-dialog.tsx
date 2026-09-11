"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { createIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";

function buildDefaultValues(
  defaultAssigneeId?: string | null,
  defaultCycleId?: string | null,
): IssueFormValues {
  return {
    title: "",
    description: "",
    status: "backlog",
    priority: "no-priority",
    assigneeId: defaultAssigneeId ?? null,
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
  defaultAssigneeId,
  defaultCycleId,
}: CreateIssueDialogProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<IssueFormValues>(() =>
    buildDefaultValues(defaultAssigneeId, defaultCycleId),
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
      setValues(buildDefaultValues(defaultAssigneeId, defaultCycleId));
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
