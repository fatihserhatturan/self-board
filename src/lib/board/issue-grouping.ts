import type { LabelColor } from "@/lib/actions/labels";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";
import { priorityLevels } from "@/lib/token-manifest";
import { STATUS_TYPES, type StatusType, type WorkflowState } from "@/lib/board/workflow-config";

export type IssueGroupKey = "status" | "assignee" | "priority" | "label" | "cycle";

export const ISSUE_GROUP_KEYS: IssueGroupKey[] = [
  "status",
  "assignee",
  "priority",
  "label",
  "cycle",
];

/** Atanmamış/etiketsiz/cycle'sız kovalarının sabit anahtarı. */
export const UNSET_GROUP_ID = "__unset__";

export interface IssueGroup {
  /** Sürükle-bırak hedef kimliği ve React anahtarı. */
  id: string;
  /** Hazır metin ya da çeviri anahtarı — `kind` hangisi olduğunu söyler. */
  label: string;
  labelKind: "text" | "translation";
  /** Durum gruplarında ikon ve renk taşıyan durum kaydı. */
  state?: Pick<WorkflowState, "icon" | "color">;
  /** Öncelik gruplarında öncelik seviyesi. */
  priority?: BoardIssue["priority"];
  /** Atanan gruplarında kişi. */
  assignee?: Person;
  /** Etiket gruplarında etiket rengi. */
  color?: LabelColor;
  issues: BoardIssue[];
  /** Bu gruba sürükleyip bırakmak bir alanı değiştirebiliyor mu? */
  droppable: boolean;
}

export interface GroupingContext {
  /** Aktif projenin durumları. `null` ise (My Issues gibi projeler-arası görünümler) sistem tipine göre gruplanır. */
  states: WorkflowState[] | null;
  users: Person[];
  labels: IssueLabel[];
  cycles: Cycle[];
}

/** Sistem tipi gruplarının anahtarı — proje seçili değilken kullanılıyor. */
export function statusTypeGroupId(type: StatusType): string {
  return `type:${type}`;
}

function byStatus(issues: BoardIssue[], states: WorkflowState[] | null): IssueGroup[] {
  // Projeler-arası görünümlerde her projenin kendi durumları var; ortak payda
  // beş sabit sistem tipi, bu yüzden orada adlar değil tipler gruplanıyor.
  if (!states) {
    return STATUS_TYPES.map((type) => ({
      id: statusTypeGroupId(type),
      label: `status.type.${type}`,
      labelKind: "translation" as const,
      issues: issues.filter((issue) => issue.state.type === type),
      // Tip bir durum değil; hangi somut duruma taşınacağı belirsiz olduğu için
      // bu görünümde sürükle-bırak kapalı.
      droppable: false,
    }));
  }

  return states.map((state) => ({
    id: state.id,
    label: state.name,
    labelKind: "text" as const,
    state,
    issues: issues.filter((issue) => issue.state.id === state.id),
    droppable: true,
  }));
}

function byAssignee(issues: BoardIssue[], users: Person[]): IssueGroup[] {
  const groups: IssueGroup[] = users.map((user) => ({
    id: user.id,
    label: user.name,
    labelKind: "text" as const,
    assignee: user,
    issues: issues.filter((issue) => issue.assignee?.id === user.id),
    droppable: true,
  }));

  groups.push({
    id: UNSET_GROUP_ID,
    label: "board.issueCard.unassigned.label",
    labelKind: "translation",
    issues: issues.filter((issue) => !issue.assignee),
    droppable: true,
  });
  return groups;
}

function byPriority(issues: BoardIssue[]): IssueGroup[] {
  return priorityLevels.map((priority) => ({
    id: priority,
    label: `board.priority.${priority}`,
    labelKind: "translation" as const,
    priority,
    issues: issues.filter((issue) => issue.priority === priority),
    droppable: true,
  }));
}

function byLabel(issues: BoardIssue[], labels: IssueLabel[]): IssueGroup[] {
  const groups: IssueGroup[] = labels.map((label) => ({
    id: label.id,
    label: label.name,
    labelKind: "text" as const,
    color: label.color,
    issues: issues.filter((issue) => issue.labels.some((l) => l.id === label.id)),
    // Bir issue birden çok etiket taşıyabildiği için "buraya taşı" tek anlamlı
    // bir işlem değil — bu gruplamada sürükle-bırak kapalı.
    droppable: false,
  }));

  groups.push({
    id: UNSET_GROUP_ID,
    label: "grouping.noLabel",
    labelKind: "translation",
    issues: issues.filter((issue) => issue.labels.length === 0),
    droppable: false,
  });
  return groups;
}

function byCycle(issues: BoardIssue[], cycles: Cycle[], cycleLabels: Map<string, string>): IssueGroup[] {
  const groups: IssueGroup[] = cycles.map((cycle) => ({
    id: cycle.id,
    label: cycleLabels.get(cycle.id) ?? cycle.name ?? `Cycle ${cycle.number}`,
    labelKind: "text" as const,
    issues: issues.filter((issue) => issue.cycleId === cycle.id),
    droppable: true,
  }));

  groups.push({
    id: UNSET_GROUP_ID,
    label: "board.cycle.none.label",
    labelKind: "translation",
    issues: issues.filter((issue) => !issue.cycleId),
    droppable: true,
  });
  return groups;
}

/**
 * Pano ve liste artık sabit durum dizisi üzerinde değil bu fonksiyonun ürettiği
 * gruplar üzerinde dönüyor. Tek yerde durduğu için iki görünüm her zaman aynı
 * gruplamayı gösteriyor ve yeni bir gruplama alanı eklemek tek dosyayı
 * değiştiriyor.
 */
export function groupIssues(
  issues: BoardIssue[],
  groupBy: IssueGroupKey,
  context: GroupingContext,
  cycleLabels: Map<string, string> = new Map(),
): IssueGroup[] {
  switch (groupBy) {
    case "assignee":
      return byAssignee(issues, context.users);
    case "priority":
      return byPriority(issues);
    case "label":
      return byLabel(issues, context.labels);
    case "cycle":
      return byCycle(issues, context.cycles, cycleLabels);
    default:
      return byStatus(issues, context.states);
  }
}
