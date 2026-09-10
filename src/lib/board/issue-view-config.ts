import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";

/**
 * `IssueFilterCriteria`/`IssueViewOptions` şekilleri, filtre/görünüm panelleriyle
 * (client component) paylaşılıyor. Bu tipleri ve varsayılan değerlerini burada,
 * client component olmayan bir dosyada tutuyoruz — `src/lib/data/views.ts` gibi
 * server-only kod, "use client" işaretli bir dosyadan runtime değer import edip
 * RSC client-reference sınırını ihlal etmesin diye.
 */
export interface IssueFilterCriteria {
  statuses: StatusState[];
  priorities: PriorityLevel[];
  assigneeIds: string[];
  labelIds: string[];
  cycleIds: string[];
}

export const EMPTY_FILTER_CRITERIA: IssueFilterCriteria = {
  statuses: [],
  priorities: [],
  assigneeIds: [],
  labelIds: [],
  cycleIds: [],
};

export type IssueSortKey = "created" | "priority" | "title";

export interface IssueViewOptions {
  sortKey: IssueSortKey;
  showAssignee: boolean;
  showLabels: boolean;
  showPriority: boolean;
}

export const DEFAULT_VIEW_OPTIONS: IssueViewOptions = {
  sortKey: "created",
  showAssignee: true,
  showLabels: true,
  showPriority: true,
};
