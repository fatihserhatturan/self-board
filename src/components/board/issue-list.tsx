"use client";

import { IssueListSection } from "@/components/board/issue-list-section";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardIssue } from "@/lib/data/issues";
import type { IssueGroup } from "@/lib/board/issue-grouping";

export interface IssueListProps {
  groups: IssueGroup[];
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function IssueList({ groups, onOpenIssue, viewOptions }: IssueListProps) {
  // Boş gruplar gizleniyor — listede "Canceled 0" gibi satırlar ekranı
  // dolduruyordu. Panoda sütunlar kalıyor, çünkü boş sütun da bırakma hedefi.
  const visible = groups.filter((group) => group.issues.length > 0);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {visible.map((group) => (
          <IssueListSection
            key={group.id}
            group={group}
            onOpenIssue={onOpenIssue}
            viewOptions={viewOptions}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
