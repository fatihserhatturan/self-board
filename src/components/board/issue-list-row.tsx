"use client";

import { AssigneeAvatar } from "@/components/board/assignee-avatar";
import { IssueContextMenu } from "@/components/board/issue-context-menu";
import { Badge } from "@/components/ui/badge";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";

const LABEL_CAP = 3;

export interface IssueListRowProps {
  issue: BoardIssue;
  onOpen?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function IssueListRow({ issue, onOpen, viewOptions }: IssueListRowProps) {
  const { t } = useLocale();
  const visibleLabels = issue.labels.slice(0, LABEL_CAP);
  const overflowCount = issue.labels.length - visibleLabels.length;

  return (
    <IssueContextMenu issue={issue}>
    <div
      role="button"
      tabIndex={0}
      aria-label={`${issue.id} ${issue.title}`}
      className="flex h-10 cursor-pointer items-center gap-3 px-4 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus-ring)]"
      onClick={() => onOpen?.(issue)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(issue);
        }
      }}
    >
      {viewOptions.showPriority && (
        <Tooltip content={t(`board.priority.${issue.priority}`)}>
          <span className="flex shrink-0">
            <PriorityIcon level={issue.priority} size="sm" />
          </span>
        </Tooltip>
      )}
      <span className="shrink-0 text-mini text-text-tertiary">{issue.id}</span>
      <span className="min-w-0 flex-1 truncate text-small text-text-primary">{issue.title}</span>
      {viewOptions.showLabels && visibleLabels.length > 0 && (
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
      {viewOptions.showAssignee && (
        <span className="flex shrink-0">
          <AssigneeAvatar assignee={issue.assignee} />
        </span>
      )}
    </div>
    </IssueContextMenu>
  );
}
