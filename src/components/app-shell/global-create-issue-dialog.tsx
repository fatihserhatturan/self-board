"use client";

import { useEffect, useState } from "react";
import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { listProjectCycles } from "@/lib/actions/cycles";
import { listProjectStates } from "@/lib/actions/workflow-states";
import type { Cycle } from "@/lib/data/cycles";
import type { WorkflowState } from "@/lib/board/workflow-config";
import type { IssueLabel, Person } from "@/lib/data/issues";
import { getCycleStatus, todayIsoDate } from "@/lib/board/cycle-status";

export interface GlobalCreateIssueDialogProps {
  users: Person[];
  labels: IssueLabel[];
}

export function GlobalCreateIssueDialog({ users, labels }: GlobalCreateIssueDialogProps) {
  const { createIssueOpen, setCreateIssueOpen, activeProjectId } = useAppShell();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [states, setStates] = useState<WorkflowState[]>([]);

  // Cycle'lar layout verisinde yok (proje başına ve yan etkili) — dialog
  // açılırken aktif proje için isteniyor, böylece buradan oluşturulan issue da
  // bir cycle'a düşüyor ve Cycles sayfasında görünüyor.
  useEffect(() => {
    if (!createIssueOpen || !activeProjectId) return;
    let cancelled = false;
    void listProjectCycles(activeProjectId).then((data) => {
      if (!cancelled) setCycles(data);
    });
    void listProjectStates(activeProjectId).then((data) => {
      if (!cancelled) setStates(data);
    });
    return () => {
      cancelled = true;
    };
  }, [createIssueOpen, activeProjectId]);

  const today = todayIsoDate();
  const activeCycle = cycles.find((cycle) => getCycleStatus(cycle, today) === "active");

  return (
    <CreateIssueDialog
      open={createIssueOpen}
      onOpenChange={setCreateIssueOpen}
      projectId={activeProjectId ?? ""}
      users={users}
      labels={labels}
      cycles={cycles}
      states={states}
      defaultCycleId={activeCycle?.id ?? null}
    />
  );
}
