"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { IssueNotes } from "@/components/board/issue-notes";
import { deleteIssue, updateIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";

export interface IssueDetailDialogProps {
  issue: BoardIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: Person[];
  labels: IssueLabel[];
}

function toFormValues(issue: BoardIssue): IssueFormValues {
  return {
    title: issue.title,
    description: issue.description ?? "",
    status: issue.status,
    priority: issue.priority,
    assigneeId: issue.assignee?.id ?? null,
    labelIds: issue.labels.map((label) => label.id),
  };
}

export function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  users,
  labels,
}: IssueDetailDialogProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<IssueFormValues | null>(issue ? toFormValues(issue) : null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [prevIssueId, setPrevIssueId] = useState(issue?.id ?? null);

  if ((issue?.id ?? null) !== prevIssueId) {
    setPrevIssueId(issue?.id ?? null);
    setConfirmingDelete(false);
    if (issue) {
      setValues(toFormValues(issue));
      setTitleError(undefined);
    }
  }

  async function handleSubmit() {
    if (!issue || !values) return;
    if (!values.title.trim()) {
      setTitleError(t("issueForm.title.required"));
      return;
    }
    setSubmitting(true);
    const result = await updateIssue(issue.id, issue.teamId, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(t("toast.issue.updateError"));
      return;
    }
    toast.success(t("toast.issue.updated"));
    onOpenChange(false);
    router.refresh();
  }

  useEffect(() => {
    if (!confirmingDelete) return;
    const timeout = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmingDelete]);

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    void handleDelete();
  }

  async function handleDelete() {
    if (!issue) return;
    setSubmitting(true);
    const result = await deleteIssue(issue.id, issue.teamId);
    setSubmitting(false);
    setConfirmingDelete(false);
    if (!result.ok) {
      toast.error(t("toast.issue.deleteError"));
      return;
    }
    toast.success(t("toast.issue.deleted"));
    onOpenChange(false);
    router.refresh();
  }

  if (!issue || !values) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="flex h-[85vh] flex-col overflow-hidden">
        <DialogTitle className="sr-only">{t("issueDetailDialog.srTitle")}</DialogTitle>
        <span className="shrink-0 text-mini text-text-tertiary">{issue.id}</span>
        <ScrollArea className="mt-2 min-h-0 flex-1">
          <div className="flex flex-col px-3">
            <IssueDialogForm
              values={values}
              onChange={setValues}
              users={users}
              labels={labels}
              titleError={titleError}
            />
            <Divider className="my-4" />
            <IssueNotes issueId={issue.id} />
          </div>
        </ScrollArea>
        <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-border-default pt-4">
          <Button
            variant={confirmingDelete ? "destructive" : "secondary"}
            className="mr-auto"
            onClick={handleDeleteClick}
            loading={submitting && confirmingDelete}
          >
            {confirmingDelete ? t("issueDetailDialog.confirmDelete") : t("issueDetailDialog.delete")}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
