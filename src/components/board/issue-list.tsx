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
  // Boş durum grupları gizleniyor — beş status'ün hepsi her zaman basıldığında
  // "Canceled 0" / "Backlog 0" satırları listeyi dolduruyordu. Board'da
  // sütunlar bırakılıyor, çünkü orada boş sütun da bir bırakma hedefi.
  const groups = statusStates
    .map((status) => ({ status, issues: issues.filter((issue) => issue.status === status) }))
    .filter((group) => group.issues.length > 0);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {groups.map((group) => (
          <IssueListSection
            key={group.status}
            status={group.status}
            issues={group.issues}
            onOpenIssue={onOpenIssue}
            viewOptions={viewOptions}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
