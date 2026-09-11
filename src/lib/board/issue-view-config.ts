import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { IssueGroupKey } from "@/lib/board/issue-grouping";

/**
 * `IssueFilterCriteria`/`IssueViewOptions` şekilleri, filtre/görünüm panelleriyle
 * (client component) paylaşılıyor. Bu tipleri ve varsayılan değerlerini burada,
 * client component olmayan bir dosyada tutuyoruz — `src/lib/data/views.ts` gibi
 * server-only kod, "use client" işaretli bir dosyadan runtime değer import edip
 * RSC client-reference sınırını ihlal etmesin diye.
 */
export interface IssueFilterCriteria {
  stateIds: string[];
  priorities: PriorityLevel[];
  assigneeIds: string[];
  labelIds: string[];
  cycleIds: string[];
}

export const EMPTY_FILTER_CRITERIA: IssueFilterCriteria = {
  stateIds: [],
  priorities: [],
  assigneeIds: [],
  labelIds: [],
  cycleIds: [],
};

export type IssueSortKey = "created" | "priority" | "title";

export interface IssueViewOptions {
  sortKey: IssueSortKey;
  /** Panonun ve listenin neye göre gruplanacağı. */
  groupBy: IssueGroupKey;
  showAssignee: boolean;
  showLabels: boolean;
  showPriority: boolean;
}

export const DEFAULT_VIEW_OPTIONS: IssueViewOptions = {
  sortKey: "created",
  groupBy: "status",
  showAssignee: true,
  showLabels: true,
  showPriority: true,
};
