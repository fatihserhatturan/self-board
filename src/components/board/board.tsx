"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "@/components/board/board-column";
import { IssueCardContent } from "@/components/board/issue-card";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StatusState } from "@/components/ui/status-icon";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import { updateIssueStatus } from "@/lib/actions/issues";
import type { BoardIssue } from "@/lib/data/issues";
import { statusStates } from "@/lib/token-manifest";

export interface BoardProps {
  issues: BoardIssue[];
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

export function Board({ issues, onOpenIssue, viewOptions }: BoardProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [boardIssues, setBoardIssues] = useState(issues);
  const [prevIssues, setPrevIssues] = useState(issues);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (issues !== prevIssues) {
    setPrevIssues(issues);
    setBoardIssues(issues);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as StatusState;
    const issue = boardIssues.find((i) => i.id === active.id);
    if (!issue || issue.status === newStatus) return;

    const previousStatus = issue.status;
    setBoardIssues((prev) =>
      prev.map((i) => (i.id === active.id ? { ...i, status: newStatus } : i)),
    );

    const result = await updateIssueStatus(issue.id, issue.teamId, newStatus);
    if (!result.ok) {
      setBoardIssues((prev) =>
        prev.map((i) => (i.id === active.id ? { ...i, status: previousStatus } : i)),
      );
      toast.error(t("toast.issue.updateError"));
      return;
    }
    router.refresh();
  }

  const activeIssue = boardIssues.find((issue) => issue.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex h-full gap-3 p-4">
          {statusStates.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={boardIssues.filter((issue) => issue.status === status)}
              onOpenIssue={onOpenIssue}
              viewOptions={viewOptions}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeIssue && (
          <IssueCardContent
            issue={activeIssue}
            viewOptions={viewOptions}
            className="cursor-grabbing shadow-dropdown"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
