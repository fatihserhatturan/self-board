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

const PRIORITIES: PriorityLevel[] = ["no-priority", "urgent", "high", "medium", "low"];

/**
 * Depodan ya da istemciden gelen ham değeri doğrular; tanınmayan değer
 * varsayılana düşer. Kullanıcı DB'yi elle düzenlemiş, eski bir sürümden bir
 * değer kalmış ya da server action'a beklenmedik bir gövde gelmiş olabilir.
 */
export function readEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

/**
 * Yazılabilir tercihler ve değerleri. Server action herhangi bir anahtarı
 * `app_settings`'e yazabiliyordu; okuma tarafı bilinmeyenleri yok saysa da
 * tablo gereksiz satır biriktiriyordu.
 */
export function sanitizePreferences(input: Partial<Preferences>): Record<string, string> {
  const result: Record<string, string> = {};
  if (input.homeView !== undefined) {
    result.homeView = readEnum(input.homeView, HOME_VIEWS, DEFAULT_PREFERENCES.homeView);
  }
  if (input.defaultIssueStateType !== undefined) {
    result.defaultIssueStateType = readEnum(
      input.defaultIssueStateType,
      STATUS_TYPES,
      DEFAULT_PREFERENCES.defaultIssueStateType,
    );
  }
  if (input.defaultIssuePriority !== undefined) {
    result.defaultIssuePriority = readEnum(
      input.defaultIssuePriority,
      PRIORITIES,
      DEFAULT_PREFERENCES.defaultIssuePriority,
    );
  }
  if (input.autoAssignToMe !== undefined) {
    result.autoAssignToMe = String(Boolean(input.autoAssignToMe));
  }
  if (input.dateFormat !== undefined) {
    result.dateFormat = readEnum(input.dateFormat, DATE_FORMATS, DEFAULT_PREFERENCES.dateFormat);
  }
  return result;
}

/**
 * Her `HomeView` için gidilecek yol. Proje gerektirenler `?project=` olmadan da
 * çalışır — `resolveActiveProject` ilk projeye düşer.
 */
export const HOME_VIEW_PATH: Record<HomeView, string> = {
  "my-issues": "/my-issues",
  issues: "/issues",
  cycles: "/cycles",
};
