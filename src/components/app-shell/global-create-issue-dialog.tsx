"use client";

import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import type { IssueLabel, Person } from "@/lib/data/issues";

export interface GlobalCreateIssueDialogProps {
  users: Person[];
  labels: IssueLabel[];
}

export function GlobalCreateIssueDialog({ users, labels }: GlobalCreateIssueDialogProps) {
  const { createIssueOpen, setCreateIssueOpen, activeProjectId } = useAppShell();

  return (
    <CreateIssueDialog
      open={createIssueOpen}
      onOpenChange={setCreateIssueOpen}
      projectId={activeProjectId ?? ""}
      users={users}
      labels={labels}
      cycles={[]}
    />
  );
}
