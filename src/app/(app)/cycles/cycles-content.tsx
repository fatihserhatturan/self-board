"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCw } from "lucide-react";
import { TopBar } from "@/components/app-shell/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { CycleCapacityMeter } from "@/components/cycles/cycle-capacity-meter";
import { CycleSummaryPanel } from "@/components/cycles/cycle-summary-panel";
import { CycleVelocityChart } from "@/components/cycles/cycle-velocity-chart";
import { renameCycle, updateCycleDuration } from "@/lib/actions/cycles";
import type { Cycle, CycleSnapshot } from "@/lib/data/cycles";
import { averageVelocity, successPercent } from "@/lib/board/cycle-metrics";
import { getCycleStatus, parseIsoDate, todayIsoDate, type CycleStatus } from "@/lib/board/cycle-status";
import { cycleLabel } from "@/lib/board/cycle-label";
import { cn } from "@/lib/utils";

const DURATION_WEEK_OPTIONS = [1, 2, 3, 4];

export interface CyclesContentProps {
  projectId: string;
  projectName: string;
  cycleDurationDays: number;
  cycles: Cycle[];
  snapshots: Record<string, CycleSnapshot[]>;
}

export function CyclesContent({
  projectId,
  projectName,
  cycleDurationDays,
  cycles: initialCycles,
  snapshots,
}: CyclesContentProps) {
  const { t, locale } = useLocale();
  const [cycles, setCycles] = useState(initialCycles);
  const [duration, setDuration] = useState(cycleDurationDays);
  const [savingDuration, setSavingDuration] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = useMemo(() => todayIsoDate(), []);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

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

  async function handleDurationChange(weeks: string) {
    const days = Number(weeks) * 7;
    setDuration(days);
    setSavingDuration(true);
    const result = await updateCycleDuration(projectId, days);
    setSavingDuration(false);
    if (!result.ok) {
      setDuration(cycleDurationDays);
      toast.error(t("cycles.durationUpdateError"));
    }
  }

  function formatRange(cycle: Cycle) {
    return `${formatter.format(parseIsoDate(cycle.startsAt))} – ${formatter.format(parseIsoDate(cycle.endsAt))}`;
  }

  function renderNameInput(cycle: Cycle, className?: string) {
    return (
      <Input
        className={cn("w-44", className)}
        defaultValue={cycle.name ?? ""}
        placeholder={cycleLabel(cycle)}
        key={`${cycle.id}-${cycle.name}`}
        onBlur={(e) => handleRename(cycle, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
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
      <TopBar
        title={t("nav.cycles")}
        breadcrumb={projectName}
        viewOptionsTrigger={
          <div className="flex items-center gap-2">
            <span className="text-mini text-text-tertiary">{t("cycles.duration.label")}</span>
            <Select
              value={String(duration / 7)}
              onValueChange={handleDurationChange}
              disabled={savingDuration}
            >
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_WEEK_OPTIONS.map((weeks) => (
                  <SelectItem key={weeks} value={String(weeks)}>
                    {weeks} {t("cycles.duration.weeksUnit")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

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
