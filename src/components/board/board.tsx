"use client";

import { useState } from "react";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { BoardColumn } from "@/components/board/board-column";
import { IssueCardContent } from "@/components/board/issue-card";
import type { StatusState } from "@/components/ui/status-icon";
import type { BoardIssue } from "@/lib/data/issues";
import { statusStates } from "@/lib/token-manifest";

export interface BoardProps {
  issues: BoardIssue[];
}

export function Board({ issues }: BoardProps) {
  const [boardIssues, setBoardIssues] = useState(issues);
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as StatusState;
    setBoardIssues((prev) =>
      prev.map((issue) => (issue.id === active.id ? { ...issue, status: newStatus } : issue)),
    );
  }

  const activeIssue = boardIssues.find((issue) => issue.id === activeId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
        {statusStates.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            issues={boardIssues.filter((issue) => issue.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue && (
          <IssueCardContent issue={activeIssue} className="cursor-grabbing shadow-dropdown" />
        )}
      </DragOverlay>
    </DndContext>
  );
}
