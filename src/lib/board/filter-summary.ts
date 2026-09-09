import type { IssueFilterCriteria } from "@/components/board/issue-filter-panel";

/** `issue-workspace.tsx`'teki filtre rozeti sayacıyla aynı hesap — view kartlarında da kullanılıyor. */
export function countActiveFilters(criteria: IssueFilterCriteria): number {
  return (
    criteria.statuses.length +
    criteria.priorities.length +
    criteria.assigneeIds.length +
    criteria.labelIds.length
  );
}
