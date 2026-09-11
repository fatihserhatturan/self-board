"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { IssueNotes } from "@/components/board/issue-notes";
import { deleteIssue, updateIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import type { WorkflowState } from "@/lib/board/workflow-config";

export interface IssueDetailDialogProps {
  issue: BoardIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: Person[];
  labels: IssueLabel[];
  cycles: Cycle[];
  states: WorkflowState[];
}

function toFormValues(issue: BoardIssue): IssueFormValues {
  return {
    title: issue.title,
    description: issue.description ?? "",
    stateId: issue.state.id,
    priority: issue.priority,
    assigneeId: issue.assignee?.id ?? null,
    cycleId: issue.cycleId,
    labelIds: issue.labels.map((label) => label.id),
  };
}

export function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  users,
  labels,
  cycles,
  states,
}: IssueDetailDialogProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<IssueFormValues | null>(issue ? toFormValues(issue) : null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  // Sunucu yeniden render'ı bitene kadar buton yükleniyor durumunda kalıyor —
  // aksi halde dialog kapanıp bir an bayat listeye dönülüyordu.
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [prevIssueId, setPrevIssueId] = useState(issue?.id ?? null);

  if ((issue?.id ?? null) !== prevIssueId) {
    setPrevIssueId(issue?.id ?? null);
    setConfirmDeleteOpen(false);
    setConfirmDiscardOpen(false);
    if (issue) {
      setValues(toFormValues(issue));
      setTitleError(undefined);
    }
  }

  const isDirty =
    issue != null && values != null && JSON.stringify(values) !== JSON.stringify(toFormValues(issue));

  /** Escape, dış tıklama ve İptal aynı yoldan geçiyor — kaydedilmemiş düzenleme sessizce atılmasın. */
  function requestOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!issue || !values) return;
    if (!values.title.trim()) {
      setTitleError(t("issueForm.title.required"));
      return;
    }
    setSubmitting(true);
    const result = await updateIssue(issue.id, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(t("toast.issue.updateError"));
      return;
    }
    toast.success(t("toast.issue.updated"));
    startTransition(() => {
      router.refresh();
      onOpenChange(false);
    });
  }

  async function handleDelete() {
    if (!issue) return;
    setSubmitting(true);
    const result = await deleteIssue(issue.id);
    setSubmitting(false);
    setConfirmDeleteOpen(false);
    if (!result.ok) {
      toast.error(t("toast.issue.deleteError"));
      return;
    }
    toast.success(t("toast.issue.deleted"));
    startTransition(() => {
      router.refresh();
      onOpenChange(false);
    });
  }

  if (!issue || !values) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent
        size="xl"
        className="flex h-[85vh] flex-col overflow-hidden"
        // Cmd/Ctrl+Enter ile kaydet — dialog'un her yerinden, editör dahil.
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      >
        <DialogTitle className="sr-only">{t("issueDetailDialog.srTitle")}</DialogTitle>
        <span className="shrink-0 text-mini text-text-tertiary">{issue.id}</span>
        <ScrollArea className="mt-2 min-h-0 flex-1">
          <div className="flex flex-col px-3">
            <IssueDialogForm
              values={values}
              onChange={setValues}
              users={users}
              labels={labels}
              cycles={cycles}
              states={states}
              titleError={titleError}
            />
            <Divider className="my-4" />
            <IssueNotes issueId={issue.id} />
          </div>
        </ScrollArea>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-border-default pt-4">
          <Button
            variant="secondary"
            className="mr-auto"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            {t("issueDetailDialog.delete")}
          </Button>
          <Button variant="secondary" onClick={() => requestOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={submitting || isPending}>
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmDeleteOpen}
      onOpenChange={setConfirmDeleteOpen}
      title={t("confirm.deleteIssue.title")}
      description={t("confirm.deleteIssue.description")}
      confirmLabel={t("common.delete")}
      loading={submitting || isPending}
      onConfirm={() => void handleDelete()}
    />

    <ConfirmDialog
      open={confirmDiscardOpen}
      onOpenChange={setConfirmDiscardOpen}
      title={t("confirm.discard.title")}
      description={t("confirm.discard.description")}
      confirmLabel={t("common.discard")}
      cancelLabel={t("common.keepEditing")}
      onConfirm={() => {
        setConfirmDiscardOpen(false);
        onOpenChange(false);
      }}
    />
    </>
  );
}
