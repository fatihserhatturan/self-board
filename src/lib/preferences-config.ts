import type { PriorityLevel } from "@/components/ui/priority-icon";
import { STATUS_TYPES, type StatusType } from "@/lib/board/workflow-config";

/**
 * Tercih tipleri ve varsayılanları — DB'siz, saf. `lib/data/preferences.ts`
 * `node:sqlite`'a bağımlı olduğu için client component'lerin oradan runtime bir
 * değer import etmesi `node:fs`'i tarayıcı chunk'ına çekip build'i bozuyor
 * (`lib/board/issue-view-config.ts` ve `cycle-status.ts` aynı gerekçeyle ayrı).
 */
export type HomeView = "my-issues" | "issues" | "cycles";
export type DateFormat = "short" | "medium" | "long";

export interface Preferences {
  homeView: HomeView;
  /** Yeni issue'nun açılacağı sistem tipi; somut durum aktif projeden çözülüyor (durumlar proje başına). */
  defaultIssueStateType: StatusType;
  defaultIssuePriority: PriorityLevel;
  autoAssignToMe: boolean;
  dateFormat: DateFormat;
}

export const DEFAULT_PREFERENCES: Preferences = {
  homeView: "my-issues",
  defaultIssueStateType: "backlog",
  defaultIssuePriority: "no-priority",
  autoAssignToMe: false,
  dateFormat: "medium",
};

export const HOME_VIEWS: HomeView[] = ["my-issues", "issues", "cycles"];
export { STATUS_TYPES };

export const DATE_FORMATS: DateFormat[] = ["short", "medium", "long"];

/**
 * Her `HomeView` için gidilecek yol. Proje gerektirenler `?project=` olmadan da
 * çalışır — `resolveActiveProject` ilk projeye düşer.
 */
export const HOME_VIEW_PATH: Record<HomeView, string> = {
  "my-issues": "/my-issues",
  issues: "/issues",
  cycles: "/cycles",
};
