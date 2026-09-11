"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChartLine, ListFilter, ListTodo, SlidersHorizontal } from "lucide-react";
import { Board } from "@/components/board/board";
import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { IssueDetailDialog } from "@/components/board/issue-detail-dialog";
import {
  EMPTY_FILTER_CRITERIA,
  IssueFilterPanel,
  type IssueFilterCriteria,
} from "@/components/board/issue-filter-panel";
import { IssueList } from "@/components/board/issue-list";
import {
  DEFAULT_VIEW_OPTIONS,
  IssueViewOptionsPanel,
  type IssueViewOptions,
} from "@/components/board/issue-view-options-panel";
import { TopBar, type TopBarView } from "@/components/app-shell/top-bar";
import { SaveViewPopover } from "@/components/board/save-view-popover";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { useAppShell } from "@/components/app-shell/app-shell-provider";
import { useLocale } from "@/components/locale-provider";
import { CycleSummaryPanel } from "@/components/cycles/cycle-summary-panel";
import type { TranslationKey } from "@/lib/i18n/types";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle, CycleSnapshot } from "@/lib/data/cycles";
import type { SavedView } from "@/lib/data/views";
import { countActiveFilters } from "@/lib/board/filter-summary";
import { cycleLabel } from "@/lib/board/cycle-label";
import { todayIsoDate } from "@/lib/board/cycle-status";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { isTypingTarget } from "@/lib/keyboard";
import { cn } from "@/lib/utils";

const PRIORITY_RANK: Record<PriorityLevel, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  "no-priority": 4,
};

export interface IssueWorkspaceProps {
  titleKey: TranslationKey;
  breadcrumb?: string;
  projectId?: string;
  cycleId?: string | null;
  issues: BoardIssue[];
  users: Person[];
  labels: IssueLabel[];
  cycles?: Cycle[];
  cycleSnapshots?: CycleSnapshot[];
  defaultAssigneeId?: string | null;
  initialView?: SavedView;
}

export function IssueWorkspace({
  titleKey,
  breadcrumb,
  projectId,
  cycleId,
  issues,
  users,
  labels,
  cycles = [],
  cycleSnapshots = [],
  defaultAssigneeId,
  initialView,
}: IssueWorkspaceProps) {
  const { t } = useLocale();
  const { activeProjectId } = useAppShell();
  const resolvedProjectId = projectId ?? activeProjectId ?? "";
  const today = useMemo(() => todayIsoDate(), []);
  const panelCycle = cycleId ? cycles.find((cycle) => cycle.id === cycleId) : undefined;
  const [cyclePanelOpen, setCyclePanelOpen] = useLocalStorageState(
    "self-board:cycle-panel-open",
    true,
  );
  const [loadedView] = useState<SavedView | null>(initialView ?? null);
  const [view, setView] = useState<TopBarView>(initialView?.layout ?? "list");

  const [createOpen, setCreateOpen] = useState(false);

  // Komut paletinden `?open={issueId}` ile gelindiğinde ilgili issue'yu ilk render'da açar.
  const searchParams = useSearchParams();
  const openIssueId = searchParams.get("open");
  const initialOpenIssue = openIssueId
    ? (issues.find((issue) => issue.id === openIssueId) ?? null)
    : null;

  const [detailIssue, setDetailIssue] = useState<BoardIssue | null>(initialOpenIssue);
  const [detailOpen, setDetailOpen] = useState(initialOpenIssue != null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<IssueFilterCriteria>(
    initialView?.filters ?? EMPTY_FILTER_CRITERIA,
  );

  const [viewOptionsOpen, setViewOptionsOpen] = useState(false);
  const [viewOptions, setViewOptions] = useLocalStorageState<IssueViewOptions>(
    "self-board:issues-view-options",
    DEFAULT_VIEW_OPTIONS,
    (v) => JSON.stringify(v),
    (raw) => {
      try {
        return { ...DEFAULT_VIEW_OPTIONS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_VIEW_OPTIONS;
      }
    },
  );

  // Kaydedilmiş bir view açıldığında, o view'ın anlık görüntüsünü kalıcı global
  // tercihin üzerine bir kerelik uygular — Linear'daki gibi görünüm seçenekleri
  // view'ın bir parçası olarak saklanıyor.
  useEffect(() => {
    if (initialView?.options) setViewOptions(initialView.options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle paneli için Cmd/Ctrl+I — Linear'daki cycle sidebar kısayolunun karşılığı.
  useEffect(() => {
    if (!panelCycle) return;
    function onKeyDown(event: KeyboardEvent) {
      // Tiptap'te Cmd+I italic demek — metin yazarken paneli açıp kapatmamalı.
      if (isTypingTarget(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        setCyclePanelOpen(!cyclePanelOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelCycle, cyclePanelOpen, setCyclePanelOpen]);

  function openDetail(issue: BoardIssue) {
    setDetailIssue(issue);
    setDetailOpen(true);
  }

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterCriteria.statuses.length > 0 && !filterCriteria.statuses.includes(issue.status)) {
        return false;
      }
      if (
        filterCriteria.priorities.length > 0 &&
        !filterCriteria.priorities.includes(issue.priority)
      ) {
        return false;
      }
      if (filterCriteria.assigneeIds.length > 0) {
        const key = issue.assignee?.id ?? "unassigned";
        if (!filterCriteria.assigneeIds.includes(key)) return false;
      }
      if (filterCriteria.labelIds.length > 0) {
        const ids = issue.labels.map((l) => l.id);
        if (!filterCriteria.labelIds.some((id) => ids.includes(id))) return false;
      }
      if (filterCriteria.cycleIds.length > 0) {
        if (!issue.cycleId || !filterCriteria.cycleIds.includes(issue.cycleId)) return false;
      }
      return true;
    });
  }, [issues, filterCriteria]);

  const sortedIssues = useMemo(() => {
    if (viewOptions.sortKey === "created") return filteredIssues;
    const arr = [...filteredIssues];
    if (viewOptions.sortKey === "priority") {
      arr.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    } else {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    }
    return arr;
  }, [filteredIssues, viewOptions.sortKey]);

  const activeFilterCount = countActiveFilters(filterCriteria);

  return (
    <>
      <TopBar
        title={t(titleKey)}
        breadcrumb={breadcrumb}
        view={view}
        onViewChange={setView}
        primaryActionLabel={t("common.newIssue")}
        onPrimaryAction={() => setCreateOpen(true)}
        filterTrigger={
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("topbar.filter.label")}
                className="relative"
              >
                <ListFilter className="size-3.5" />
                {activeFilterCount > 0 && (
                  <Badge size="sm" color="blue" className="absolute -right-1 -top-1 px-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <IssueFilterPanel
                criteria={filterCriteria}
                onChange={setFilterCriteria}
                onClear={() => setFilterCriteria(EMPTY_FILTER_CRITERIA)}
                users={users}
                labels={labels}
                cycles={cycles}
              />
            </PopoverContent>
          </Popover>
        }
        viewOptionsTrigger={
          <Popover open={viewOptionsOpen} onOpenChange={setViewOptionsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("topbar.viewOptions.label")}>
                <SlidersHorizontal className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <IssueViewOptionsPanel options={viewOptions} onChange={setViewOptions} />
            </PopoverContent>
          </Popover>
        }
        saveViewTrigger={
          <SaveViewPopover
            input={{
              projectId: resolvedProjectId,
              layout: view,
              filters: filterCriteria,
              options: viewOptions,
            }}
            loadedView={loadedView}
          />
        }
        cyclePanelTrigger={
          panelCycle && (
            <Tooltip content={t("cycles.panel.toggle")}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("cycles.panel.toggle")}
                aria-pressed={cyclePanelOpen}
                onClick={() => setCyclePanelOpen(!cyclePanelOpen)}
              >
                <ChartLine className={cn("size-3.5", cyclePanelOpen && "text-accent")} />
              </Button>
            </Tooltip>
          )
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {issues.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title={t("emptyState.issues.title")}
              action={{ label: t("emptyState.issues.action"), onClick: () => setCreateOpen(true) }}
            />
          ) : sortedIssues.length === 0 ? (
            <EmptyState
              icon={ListFilter}
              title={t("emptyState.filtered.title")}
              description={t("emptyState.filtered.description")}
              action={{
                label: t("emptyState.filtered.action"),
                onClick: () => setFilterCriteria(EMPTY_FILTER_CRITERIA),
              }}
            />
          ) : view === "board" ? (
            <Board issues={sortedIssues} onOpenIssue={openDetail} viewOptions={viewOptions} />
          ) : (
            <IssueList issues={sortedIssues} onOpenIssue={openDetail} viewOptions={viewOptions} />
          )}
        </div>

        {panelCycle && cyclePanelOpen && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-border-default p-4">
            <p className="mb-3 text-small font-medium text-text-primary">
              {cycleLabel(panelCycle)}
            </p>
            <CycleSummaryPanel
              cycle={panelCycle}
              snapshots={cycleSnapshots}
              todayIso={today}
            />
          </aside>
        )}
      </div>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={resolvedProjectId}
        users={users}
        labels={labels}
        cycles={cycles}
        defaultAssigneeId={defaultAssigneeId}
        defaultCycleId={cycleId}
      />

      <IssueDetailDialog
        issue={detailIssue}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        users={users}
        labels={labels}
        cycles={cycles}
      />
    </>
  );
}
