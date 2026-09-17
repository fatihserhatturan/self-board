"use client";

import { useDraggable } from "@dnd-kit/core";
import { AssigneeAvatar } from "@/components/board/assignee-avatar";
import { IssueContextMenu } from "@/components/board/issue-context-menu";
import { Badge } from "@/components/ui/badge";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";
import { cn } from "@/lib/utils";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";

export interface IssueCardContentProps {
  issue: BoardIssue;
  viewOptions: IssueViewOptions;
  className?: string;
}

/**
 * Pure presentational card body — no dnd-kit hooks. Used both by the
 * draggable `IssueCard` (below) and by `Board`'s `DragOverlay`, which needs
 * its own visual copy of the card WITHOUT calling `useDraggable` again (that
 * would register a second node under the same issue id in dnd-kit's internal
 * registry while the drag is active, corrupting the real card's tracking).
 */
export function IssueCardContent({ issue, viewOptions, className }: IssueCardContentProps) {
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
        {viewOptions.showPriority && (
          <Tooltip content={t(`board.priority.${issue.priority}`)}>
            <span className="flex">
              <PriorityIcon level={issue.priority} size="sm" />
            </span>
          </Tooltip>
        )}
      </div>

      <p className="text-small text-text-primary">{issue.title}</p>

      {viewOptions.showLabels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.map((label) => (
            <Badge key={label.id} color={label.color} size="sm">
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {viewOptions.showAssignee && (
        <div className="flex justify-end">
          <AssigneeAvatar assignee={issue.assignee} />
        </div>
      )}
    </div>
  );
}

export interface IssueCardProps {
  issue: BoardIssue;
  onOpen?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
  /** Etikete göre gruplandığında sürükle-bırak anlamlı olmadığı için kapalı. */
  draggable?: boolean;
}

export function IssueCard({ issue, onOpen, viewOptions, draggable = true }: IssueCardProps) {
  // Etikete göre gruplandığında bir issue birden çok sütunda görünüyor; her biri
  // `useDraggable` çağırsaydı aynı id dnd-kit'in kaydına iki kez girerdi. Sürükleme
  // kapalı olan sütunlar hook'u hiç kurmayan bu dala düşüyor.
  if (!draggable) {
    return <StaticIssueCard issue={issue} onOpen={onOpen} viewOptions={viewOptions} />;
  }
  return <DraggableIssueCard issue={issue} onOpen={onOpen} viewOptions={viewOptions} />;
}

function StaticIssueCard({ issue, onOpen, viewOptions }: IssueCardProps) {
  return (
    <IssueContextMenu issue={issue}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${issue.id} ${issue.title}`}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        onClick={() => onOpen?.(issue)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen?.(issue);
          }
        }}
      >
        <IssueCardContent
          issue={issue}
          viewOptions={viewOptions}
          className="cursor-pointer hover:border-border-strong"
        />
      </div>
    </IssueContextMenu>
  );
}

function DraggableIssueCard({ issue, onOpen, viewOptions }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <IssueContextMenu issue={issue}>
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={`${issue.id} ${issue.title}`}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      onClick={() => {
        if (!isDragging) onOpen?.(issue);
      }}
      // dnd-kit `attributes` role/tabIndex veriyor ama yalnızca sürükleme için;
      // kartı klavyeyle açmanın bir yolu yoktu.
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(issue);
        }
      }}
    >
      <IssueCardContent
        issue={issue}
        viewOptions={viewOptions}
        className={cn(
          "cursor-grab hover:border-border-strong active:cursor-grabbing",
          isDragging && "opacity-40",
        )}
      />
    </div>
    </IssueContextMenu>
  );
}
