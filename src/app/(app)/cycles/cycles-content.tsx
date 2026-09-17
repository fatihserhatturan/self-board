"use client";

import { useMemo, useState } from "react";
import { useSyncedState } from "@/lib/use-synced-state";
import Link from "next/link";
import { ChevronRight, RotateCw } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRenameInput } from "@/components/ui/inline-rename-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { CycleCapacityMeter } from "@/components/cycles/cycle-capacity-meter";
import { CycleSummaryPanel } from "@/components/cycles/cycle-summary-panel";
import { CycleVelocityChart } from "@/components/cycles/cycle-velocity-chart";
import { renameCycle } from "@/lib/actions/cycles";
import type { Cycle, CycleSnapshot } from "@/lib/data/cycles";
import { averageVelocity, successPercent } from "@/lib/board/cycle-metrics";
import { getCycleStatus, parseIsoDate, todayIsoDate, type CycleStatus } from "@/lib/board/cycle-status";
import { cycleLabel } from "@/lib/board/cycle-label";
import { useDateFormatter } from "@/lib/use-date-formatter";
import { cn } from "@/lib/utils";

export interface CyclesContentProps {
  projectId: string;
  projectName: string;
  cycles: Cycle[];
  snapshots: Record<string, CycleSnapshot[]>;
}

export function CyclesContent({
  projectId,
  projectName,
  cycles: initialCycles,
  snapshots,
}: CyclesContentProps) {
  const { t } = useLocale();
  const [cycles, setCycles] = useSyncedState(initialCycles);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = useMemo(() => todayIsoDate(), []);

  const { formatDayMonth } = useDateFormatter();

  const grouped = useMemo(() => {
    const groups: Record<CycleStatus, Cycle[]> = { active: [], upcoming: [], completed: [] };
    for (const cycle of cycles) groups[getCycleStatus(cycle, today)].push(cycle);
    return groups;
  }, [cycles, today]);

  const velocity = useMemo(() => averageVelocity(grouped.completed), [grouped.completed]);
  const activeCycle = grouped.active[0];

  async function handleRename(cycle: Cycle, name: string) {
    if (name === (cycle.name ?? "")) return;
    setCycles((prev) => prev.map((c) => (c.id === cycle.id ? { ...c, name: name || null } : c)));
    const result = await renameCycle(cycle.id, name);
    if (!result.ok) {
      setCycles((prev) => prev.map((c) => (c.id === cycle.id ? cycle : c)));
      toast.error(t("cycles.renameError"));
    }
  }

  function formatRange(cycle: Cycle) {
    return `${formatDayMonth(parseIsoDate(cycle.startsAt))} – ${formatDayMonth(parseIsoDate(cycle.endsAt))}`;
  }

  function renderNameInput(cycle: Cycle, className?: string) {
    return (
      <InlineRenameInput
        className={cn("w-44", className)}
        value={cycle.name ?? ""}
        placeholder={cycleLabel(cycle)}
        ariaLabel={cycleLabel(cycle)}
        onRename={(next) => handleRename(cycle, next)}
      />
    );
  }

  function renderCycleRow(cycle: Cycle, status: CycleStatus) {
    const percent = successPercent(cycle.counts);
    const expanded = expandedId === cycle.id;

    return (
      <Collapsible
        key={cycle.id}
        open={expanded}
        onOpenChange={(open) => setExpandedId(open ? cycle.id : null)}
        className="rounded-lg border border-border-default"
      >
        <div className="flex items-center gap-3 p-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("cycles.expandAction")}>
              <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>

          {renderNameInput(cycle)}

          <span className="shrink-0 text-mini text-text-tertiary">{formatRange(cycle)}</span>

          {status === "upcoming" ? (
            <CycleCapacityMeter
              plannedScope={cycle.totalIssues}
              velocity={velocity}
              className="ml-auto"
            />
          ) : (
            <div className="ml-auto flex min-w-40 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="shrink-0 text-mini text-text-tertiary [font-variant-numeric:tabular-nums]">
                {percent}%
              </span>
            </div>
          )}

          <span className="shrink-0 text-mini text-text-tertiary [font-variant-numeric:tabular-nums]">
            {cycle.completedIssues}/{cycle.totalIssues}
          </span>

          <Button variant="secondary" size="sm" asChild>
            <Link href={`/issues?project=${projectId}&cycle=${cycle.id}`}>
              {t("cycles.openAction")}
            </Link>
          </Button>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border-default p-4">
            <CycleSummaryPanel
              cycle={cycle}
              snapshots={snapshots[cycle.id] ?? []}
              todayIso={today}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  function renderSection(status: Exclude<CycleStatus, "active">, color: "blue" | "grey") {
    const list = grouped[status];
    if (list.length === 0) return null;
    return (
      <section className="flex flex-col gap-2">
        <Badge size="sm" color={color} className="self-start">
          {t(`cycles.status.${status}`)}
        </Badge>
        {list.map((cycle) => renderCycleRow(cycle, status))}
      </section>
    );
  }

  return (
    <>
      <TopBar title={t("nav.cycles")} breadcrumb={projectName} />

      {cycles.length === 0 ? (
        <EmptyState icon={RotateCw} title={t("emptyState.cycles.title")} />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 p-4">
            {activeCycle && (
              <section className="flex flex-col gap-4 rounded-lg border border-border-default p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge size="sm" color="green">
                    {t("cycles.status.active")}
                  </Badge>
                  {renderNameInput(activeCycle)}
                  <span className="text-mini text-text-tertiary">{formatRange(activeCycle)}</span>
                  <Button variant="secondary" size="sm" asChild className="ml-auto">
                    <Link href={`/issues?project=${projectId}&cycle=${activeCycle.id}`}>
                      {t("cycles.openAction")}
                    </Link>
                  </Button>
                </div>

                <CycleSummaryPanel
                  cycle={activeCycle}
                  snapshots={snapshots[activeCycle.id] ?? []}
                  todayIso={today}
                />
              </section>
            )}

            <CycleVelocityChart completedCycles={grouped.completed} />

            {renderSection("upcoming", "blue")}
            {renderSection("completed", "grey")}
          </div>
        </ScrollArea>
      )}
    </>
  );
}
