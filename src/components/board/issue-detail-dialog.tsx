"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { updateIssue, type IssueFormValues } from "@/lib/actions/issues";
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
  const [prevIssueId, setPrevIssueId] = useState(issue?.id ?? null);

  if ((issue?.id ?? null) !== prevIssueId) {
    setPrevIssueId(issue?.id ?? null);
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

  if (!issue || !values) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogTitle className="sr-only">{t("issueDetailDialog.srTitle")}</DialogTitle>
        <span className="text-mini text-text-tertiary">{issue.id}</span>
        <div className="mt-2">
          <IssueDialogForm
            values={values}
            onChange={setValues}
            users={users}
            labels={labels}
            titleError={titleError}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
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
