"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusIcon, type StatusState } from "@/components/ui/status-icon";
import { IssueListRow } from "@/components/board/issue-list-row";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";

export interface IssueListSectionProps {
  status: StatusState;
  issues: BoardIssue[];
}

export function IssueListSection({ status, issues }: IssueListSectionProps) {
  const { t } = useLocale();

  return (
    <Collapsible defaultOpen className="group border-b border-border-default last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-bg-muted">
        <ChevronRight className="size-3.5 shrink-0 text-text-tertiary transition-transform group-data-[state=open]:rotate-90" />
        <StatusIcon state={status} size="sm" />
        <span className="text-small font-medium text-text-primary">
          {t(`board.status.${status}`)}
        </span>
        <Badge size="sm" color="grey">
          {issues.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col divide-y divide-border-default">
          {issues.map((issue) => (
            <IssueListRow key={issue.id} issue={issue} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
