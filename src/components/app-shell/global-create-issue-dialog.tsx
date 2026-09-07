"use client";

import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import type { IssueLabel, Person } from "@/lib/data/issues";

export interface GlobalCreateIssueDialogProps {
  users: Person[];
  labels: IssueLabel[];
}

export function GlobalCreateIssueDialog({ users, labels }: GlobalCreateIssueDialogProps) {
  const { createIssueOpen, setCreateIssueOpen } = useAppShell();

  return (
    <CreateIssueDialog
      open={createIssueOpen}
      onOpenChange={setCreateIssueOpen}
      teamId={DEFAULT_TEAM.slug}
      users={users}
      labels={labels}
    />
  );
}
