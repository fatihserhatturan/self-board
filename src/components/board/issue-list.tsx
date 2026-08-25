"use client";

import { IssueListSection } from "@/components/board/issue-list-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardIssue } from "@/lib/data/issues";
import { statusStates } from "@/lib/token-manifest";

export interface IssueListProps {
  issues: BoardIssue[];
}

export function IssueList({ issues }: IssueListProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {statusStates.map((status) => (
          <IssueListSection
            key={status}
            status={status}
            issues={issues.filter((issue) => issue.status === status)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
