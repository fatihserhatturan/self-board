"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";
import { cn } from "@/lib/utils";

export interface IssueCardContentProps {
  issue: BoardIssue;
  className?: string;
}

/**
 * Pure presentational card body — no dnd-kit hooks. Used both by the
 * draggable `IssueCard` (below) and by `Board`'s `DragOverlay`, which needs
 * its own visual copy of the card WITHOUT calling `useDraggable` again (that
 * would register a second node under the same issue id in dnd-kit's internal
 * registry while the drag is active, corrupting the real card's tracking).
 */
export function IssueCardContent({ issue, className }: IssueCardContentProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-3 shadow-button-2 transition-colors",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-mini text-text-tertiary">{issue.id}</span>
        <Tooltip content={t(`board.priority.${issue.priority}`)}>
          <span className="flex">
            <PriorityIcon level={issue.priority} size="sm" />
          </span>
        </Tooltip>
      </div>

      <p className="text-small text-text-primary">{issue.title}</p>

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.map((label) => (
            <Badge key={label.id} color={label.color} size="sm">
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-end">
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
      </div>
    </div>
  );
}

export interface IssueCardProps {
  issue: BoardIssue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCardContent
        issue={issue}
        className={cn(
          "cursor-grab hover:border-border-strong active:cursor-grabbing",
          isDragging && "opacity-40",
        )}
      />
    </div>
  );
}
