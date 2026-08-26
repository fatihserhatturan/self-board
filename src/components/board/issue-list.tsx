"use client";

import { IssueListSection } from "@/components/board/issue-list-section";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardIssue } from "@/lib/data/issues";
import { statusStates } from "@/lib/token-manifest";

export interface IssueListProps {
  issues: BoardIssue[];
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function IssueList({ issues, onOpenIssue, viewOptions }: IssueListProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {statusStates.map((status) => (
          <IssueListSection
            key={status}
            status={status}
            issues={issues.filter((issue) => issue.status === status)}
            onOpenIssue={onOpenIssue}
            viewOptions={viewOptions}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
