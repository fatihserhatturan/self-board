"use client";

import { useState } from "react";
import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { useProjectCycles, useProjectStates } from "@/components/board/use-project-data";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import type { IssueLabel, Person } from "@/lib/data/issues";
import { getCycleStatus, todayIsoDate } from "@/lib/board/cycle-status";

export interface GlobalCreateIssueDialogProps {
  users: Person[];
  labels: IssueLabel[];
}

export function GlobalCreateIssueDialog({ users, labels }: GlobalCreateIssueDialogProps) {
  const { createIssueOpen, setCreateIssueOpen, activeProjectId, projects } = useAppShell();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(activeProjectId);
  const [wasOpen, setWasOpen] = useState(createIssueOpen);

  // Her açılışta aktif projeden başlar; kullanıcı dialog içinde başka bir proje seçebilir.
  if (createIssueOpen !== wasOpen) {
    setWasOpen(createIssueOpen);
    if (createIssueOpen) setSelectedProjectId(activeProjectId);
  }

  const projectId = selectedProjectId ?? activeProjectId;

  // Durumlar ve cycle'lar layout verisinde yok (proje başına; cycle'lar yan
  // etkili) — dialog açıkken seçili proje için isteniyor. Kapalıyken `null`
  // geçildiği için her açılışta tazeleniyor.
  const fetchId = createIssueOpen ? projectId : null;
  const { data: cycles } = useProjectCycles(fetchId);
  const { data: states } = useProjectStates(fetchId);

  const today = todayIsoDate();
  const activeCycle = cycles.find((cycle) => getCycleStatus(cycle, today) === "active");

  return (
    <CreateIssueDialog
      open={createIssueOpen}
      onOpenChange={setCreateIssueOpen}
      projectId={projectId ?? ""}
      users={users}
      labels={labels}
      cycles={cycles}
      states={states}
      defaultCycleId={activeCycle?.id ?? null}
      projects={projects}
      onProjectIdChange={setSelectedProjectId}
    />
  );
}
