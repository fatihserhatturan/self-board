"use client";

import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GroupHeader } from "@/components/board/group-header";
import { IssueListRow } from "@/components/board/issue-list-row";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";
import type { BoardIssue } from "@/lib/data/issues";
import type { IssueGroup } from "@/lib/board/issue-grouping";

export interface IssueListSectionProps {
  group: IssueGroup;
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function IssueListSection({ group, onOpenIssue, viewOptions }: IssueListSectionProps) {
  return (
    <Collapsible defaultOpen className="group border-b border-border-default last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-bg-muted">
        <ChevronRight className="size-3.5 shrink-0 text-text-tertiary transition-transform group-data-[state=open]:rotate-90" />
        <GroupHeader group={group} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col divide-y divide-border-default">
          {group.issues.map((issue) => (
            <IssueListRow
              key={issue.id}
              issue={issue}
              onOpen={onOpenIssue}
              viewOptions={viewOptions}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
