"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { IssueDialogForm } from "@/components/board/issue-dialog-form";
import { createIssue, type IssueFormValues } from "@/lib/actions/issues";
import type { IssueLabel, Person } from "@/lib/data/issues";

function buildDefaultValues(defaultAssigneeId?: string | null): IssueFormValues {
  return {
    title: "",
    description: "",
    status: "backlog",
    priority: "no-priority",
    assigneeId: defaultAssigneeId ?? null,
    labelIds: [],
  };
}

export interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  users: Person[];
  labels: IssueLabel[];
  defaultAssigneeId?: string | null;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  teamId,
  users,
  labels,
  defaultAssigneeId,
}: CreateIssueDialogProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<IssueFormValues>(() => buildDefaultValues(defaultAssigneeId));
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(buildDefaultValues(defaultAssigneeId));
      setTitleError(undefined);
    }
  }

  async function handleSubmit() {
    if (!values.title.trim()) {
      setTitleError(t("issueForm.title.required"));
      return;
    }
    setSubmitting(true);
    const result = await createIssue(teamId, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(t("toast.issue.createError"));
      return;
    }
    toast.success(t("toast.issue.created"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogTitle>{t("common.newIssue")}</DialogTitle>
        <div className="mt-4">
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
            {t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
