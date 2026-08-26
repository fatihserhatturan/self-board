"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusIcon, type StatusState } from "@/components/ui/status-icon";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";
import { cn } from "@/lib/utils";
import { IssueCard } from "@/components/board/issue-card";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";

export interface BoardColumnProps {
  status: StatusState;
  issues: BoardIssue[];
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function BoardColumn({ status, issues, onOpenIssue, viewOptions }: BoardColumnProps) {
  const { t } = useLocale();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg bg-bg-subtle transition-colors",
        isOver && "bg-bg-muted",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <StatusIcon state={status} size="sm" />
        <span className="text-small font-medium text-text-primary">
          {t(`board.status.${status}`)}
        </span>
        <Badge size="sm" color="grey">
          {issues.length}
        </Badge>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 px-2 pb-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onOpen={onOpenIssue} viewOptions={viewOptions} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
