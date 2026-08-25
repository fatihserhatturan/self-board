"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";

const LABEL_CAP = 3;

export interface IssueListRowProps {
  issue: BoardIssue;
}

export function IssueListRow({ issue }: IssueListRowProps) {
  const { t } = useLocale();
  const visibleLabels = issue.labels.slice(0, LABEL_CAP);
  const overflowCount = issue.labels.length - visibleLabels.length;

  return (
    <div className="flex h-10 items-center gap-3 px-4 transition-colors hover:bg-bg-muted">
      <Tooltip content={t(`board.priority.${issue.priority}`)}>
        <span className="flex shrink-0">
          <PriorityIcon level={issue.priority} size="sm" />
        </span>
      </Tooltip>
      <span className="shrink-0 text-mini text-text-tertiary">{issue.id}</span>
      <span className="min-w-0 flex-1 truncate text-small text-text-primary">{issue.title}</span>
      {visibleLabels.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {visibleLabels.map((label) => (
            <Badge key={label.id} color={label.color} size="sm">
              {label.name}
            </Badge>
          ))}
          {overflowCount > 0 && (
            <Badge size="sm" color="grey">
              +{overflowCount}
            </Badge>
          )}
        </div>
      )}
      <span className="flex shrink-0">
        {issue.assignee ? (
          <Tooltip content={issue.assignee.name}>
            <span className="flex">
              <Avatar name={issue.assignee.name} size="sm" />
            </span>
          </Tooltip>
        ) : (
          <Tooltip content={t("board.issueCard.unassigned.label")}>
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border-default text-micro text-text-tertiary">
              ?
            </span>
          </Tooltip>
        )}
      </span>
    </div>
  );
}
