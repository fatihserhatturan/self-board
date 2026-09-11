"use client";

import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardIssue } from "@/lib/data/issues";
import type { IssueGroup } from "@/lib/board/issue-grouping";
import { cn } from "@/lib/utils";
import { GroupHeader } from "@/components/board/group-header";
import { IssueCard } from "@/components/board/issue-card";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";

export interface BoardColumnProps {
  group: IssueGroup;
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function BoardColumn({ group, onOpenIssue, viewOptions }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id, disabled: !group.droppable });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg bg-bg-subtle transition-colors",
        isOver && group.droppable && "bg-bg-muted",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GroupHeader group={group} />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 px-2 pb-3">
          {group.issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onOpen={onOpenIssue}
              viewOptions={viewOptions}
              draggable={group.droppable}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
