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
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/locale-provider";
import type { BoardIssue } from "@/lib/data/issues";
import type { IssueGroup, IssueGroupKey } from "@/lib/board/issue-grouping";
import { UNSET_GROUP_ID } from "@/lib/board/issue-grouping";
import {
  updateIssueAssignee,
  updateIssueCycle,
  updateIssuePriority,
  updateIssueState,
} from "@/lib/actions/issues";
import type { PriorityLevel } from "@/components/ui/priority-icon";

export interface BoardProps {
  groups: IssueGroup[];
  groupBy: IssueGroupKey;
  onOpenIssue?: (issue: BoardIssue) => void;
  viewOptions: IssueViewOptions;
}

/** Bir kartın hedef gruba bırakılması hangi alanı değiştiriyor? */
function applyDrop(
  groupBy: IssueGroupKey,
  issueId: string,
  targetGroupId: string,
): Promise<{ ok: boolean }> {
  const unset = targetGroupId === UNSET_GROUP_ID;
  switch (groupBy) {
    case "assignee":
      return updateIssueAssignee(issueId, unset ? null : targetGroupId);
    case "priority":
      return updateIssuePriority(issueId, targetGroupId as PriorityLevel);
    case "cycle":
      return updateIssueCycle(issueId, unset ? null : targetGroupId);
    default:
      return updateIssueState(issueId, targetGroupId);
  }
}

/** Bir issue'nun bulunduğu grubun anahtarı — iyimser güncellemeyi geri almak için. */
function currentGroupId(groups: IssueGroup[], issueId: string): string | null {
  for (const group of groups) {
    if (group.issues.some((issue) => issue.id === issueId)) return group.id;
  }
  return null;
}

export function Board({ groups, groupBy, onOpenIssue, viewOptions }: BoardProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Sürükleme sırasında kartı hedef sütunda göstermek için yalnızca bu eşleme
  // tutuluyor; grupların kendisi sunucudan geliyor ve `router.refresh()` ile
  // tazeleniyor — iki ayrı doğruluk kaynağı oluşmasın.
  const [movedTo, setMovedTo] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const displayGroups: IssueGroup[] =
    Object.keys(movedTo).length === 0
      ? groups
      : groups.map((group) => ({
          ...group,
          issues: groups
            .flatMap((source) => source.issues)
            .filter((issue) => (movedTo[issue.id] ?? currentGroupId(groups, issue.id)) === group.id),
        }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = String(active.id);
    const targetGroupId = String(over.id);
    const sourceGroupId = currentGroupId(displayGroups, issueId);
    if (!sourceGroupId || sourceGroupId === targetGroupId) return;

    setMovedTo((prev) => ({ ...prev, [issueId]: targetGroupId }));

    const result = await applyDrop(groupBy, issueId, targetGroupId);
    if (!result.ok) {
      setMovedTo((prev) => {
        const next = { ...prev };
        delete next[issueId];
        return next;
      });
      toast.error(t("toast.issue.updateError"));
      return;
    }
    setMovedTo({});
    router.refresh();
  }

  const activeIssue = displayGroups
    .flatMap((group) => group.issues)
    .find((issue) => issue.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex h-full gap-3 p-4">
          {displayGroups.map((group) => (
            <BoardColumn
              key={group.id}
              group={group}
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
