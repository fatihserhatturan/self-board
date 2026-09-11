import {
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleDotDashed,
  CircleHelp,
  CirclePause,
  CircleSlash,
  CircleX,
  Clock,
  Eye,
  Flag,
  FlaskConical,
  GitPullRequest,
  Hammer,
  Inbox,
  Layers,
  Lightbulb,
  Rocket,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { LabelColor } from "@/lib/actions/labels";

/**
 * Durumlar (board sütunları) kullanıcı tarafından tanımlanıyor ama her biri beş
 * SABİT sistem tipinden birine bağlı. Cycle devri, burnup grafiği ve başarı
 * yüzdesi "hangi durum bitmiş sayılır" sorusunu bu tip üzerinden cevaplıyor;
 * tip olmasaydı serbest sütunlar bu metrikleri anlamsızlaştırırdı.
 *
 * DB'siz, saf modül — `lib/data/*` `node:sqlite`'a bağımlı olduğu için client
 * component'ler durum tiplerini buradan alıyor (`cycle-status.ts` ve
 * `preferences-config.ts` ile aynı gerekçe).
 */
export type StatusType = "backlog" | "unstarted" | "started" | "completed" | "canceled";

/** Pano ve ayarlarda kullanılan doğal sıra: soldan sağa iş akışı. */
export const STATUS_TYPES: StatusType[] = [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
];

/** Cycle metriklerinde "bitmiş" sayılan tipler. */
export const CLOSED_STATUS_TYPES: StatusType[] = ["completed", "canceled"];

export interface WorkflowState {
  id: string;
  projectId: string;
  name: string;
  type: StatusType;
  color: LabelColor;
  /** `STATE_ICONS` anahtarı. Bilinmeyen değer varsayılana düşer. */
  icon: string;
  position: number;
}

/**
 * Durum ikonu seçenekleri. Lucide'ın tamamı yerine durum anlatmaya yarayan
 * seçili bir set — ayarlardaki ızgara bu listeden üretiliyor.
 */
export const STATE_ICONS: Record<string, LucideIcon> = {
  "circle-dashed": CircleDashed,
  circle: Circle,
  "circle-dot": CircleDot,
  "circle-dot-dashed": CircleDotDashed,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  "circle-slash": CircleSlash,
  "circle-pause": CirclePause,
  "circle-alert": CircleAlert,
  "circle-help": CircleHelp,
  inbox: Inbox,
  layers: Layers,
  lightbulb: Lightbulb,
  hammer: Hammer,
  eye: Eye,
  "git-pull-request": GitPullRequest,
  "flask-conical": FlaskConical,
  clock: Clock,
  flag: Flag,
  send: Send,
  rocket: Rocket,
  sparkles: Sparkles,
};

export const STATE_ICON_NAMES = Object.keys(STATE_ICONS);

export const FALLBACK_STATE_ICON = "circle";

export function resolveStateIcon(name: string): LucideIcon {
  return STATE_ICONS[name] ?? STATE_ICONS[FALLBACK_STATE_ICON];
}

export interface DefaultState {
  /** Migration'da eski `issues.status` literalini yeni satıra bağlayan anahtar. */
  legacyStatus: string;
  name: string;
  type: StatusType;
  color: LabelColor;
  icon: string;
}

/**
 * Yeni bir projenin başlangıç durumları — bugünkü sabit beşliyle birebir aynı
 * adlar, renkler ve ikonlar, böylece var olan veritabanları görsel olarak
 * hiç değişmeden geçiş yapıyor.
 */
export const DEFAULT_STATES: DefaultState[] = [
  { legacyStatus: "backlog", name: "Backlog", type: "backlog", color: "grey", icon: "circle-dashed" },
  { legacyStatus: "todo", name: "Todo", type: "unstarted", color: "grey", icon: "circle" },
  {
    legacyStatus: "in-progress",
    name: "In Progress",
    type: "started",
    color: "yellow",
    icon: "circle-dot",
  },
  { legacyStatus: "done", name: "Done", type: "completed", color: "green", icon: "circle-check" },
  // Linear'da iptal nötr/gri, hata durumu değil — kırmızı bilerek kullanılmıyor.
  { legacyStatus: "canceled", name: "Canceled", type: "canceled", color: "grey", icon: "circle-x" },
];
