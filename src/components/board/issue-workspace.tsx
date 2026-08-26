"use client";

import { useMemo, useState } from "react";
import { ListFilter, ListTodo, SlidersHorizontal } from "lucide-react";
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
import type { PriorityLevel } from "@/components/ui/priority-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/components/locale-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

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
  teamId: string;
  issues: BoardIssue[];
  users: Person[];
  labels: IssueLabel[];
  defaultAssigneeId?: string | null;
}

export function IssueWorkspace({
  titleKey,
  breadcrumb,
  teamId,
  issues,
  users,
  labels,
  defaultAssigneeId,
}: IssueWorkspaceProps) {
  const { t } = useLocale();
  const [view, setView] = useState<TopBarView>("list");

  const [createOpen, setCreateOpen] = useState(false);

  const [detailIssue, setDetailIssue] = useState<BoardIssue | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<IssueFilterCriteria>(EMPTY_FILTER_CRITERIA);

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

  const activeFilterCount =
    filterCriteria.statuses.length +
    filterCriteria.priorities.length +
    filterCriteria.assigneeIds.length +
    filterCriteria.labelIds.length;

  return (
    <>
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <Popover open={viewOptionsOpen} onOpenChange={setViewOptionsOpen}>
          <TopBar
            title={t(titleKey)}
            breadcrumb={breadcrumb}
            view={view}
            onViewChange={setView}
            primaryActionLabel={t("common.newIssue")}
            onPrimaryAction={() => setCreateOpen(true)}
            filterTrigger={
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
            }
            viewOptionsTrigger={
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("topbar.viewOptions.label")}
                >
                  <SlidersHorizontal className="size-3.5" />
                </Button>
              </PopoverTrigger>
            }
          />
          <PopoverContent align="end" className="w-64">
            <IssueViewOptionsPanel options={viewOptions} onChange={setViewOptions} />
          </PopoverContent>
        </Popover>
        <PopoverContent align="end" className="w-80">
          <IssueFilterPanel
            criteria={filterCriteria}
            onChange={setFilterCriteria}
            onClear={() => setFilterCriteria(EMPTY_FILTER_CRITERIA)}
            users={users}
            labels={labels}
          />
        </PopoverContent>
      </Popover>

      {issues.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={t("emptyState.issues.title")}
          action={{ label: t("emptyState.issues.action"), onClick: () => setCreateOpen(true) }}
        />
      ) : view === "board" ? (
        <Board issues={sortedIssues} onOpenIssue={openDetail} viewOptions={viewOptions} />
      ) : (
        <IssueList issues={sortedIssues} onOpenIssue={openDetail} viewOptions={viewOptions} />
      )}

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        teamId={teamId}
        users={users}
        labels={labels}
        defaultAssigneeId={defaultAssigneeId}
      />

      <IssueDetailDialog
        issue={detailIssue}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        users={users}
        labels={labels}
      />
    </>
  );
}
