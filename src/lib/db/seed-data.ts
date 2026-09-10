import type { BadgeProps } from "@/components/ui/badge";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";

export interface SeedPerson {
  id: string;
  name: string;
  email: string;
  isCurrent?: boolean;
}

export interface SeedLabel {
  id: string;
  name: string;
  color: NonNullable<BadgeProps["color"]>;
}

export interface SeedIssue {
  id: string;
  title: string;
  description?: string;
  status: StatusState;
  priority: PriorityLevel;
  assigneeId?: string;
  labelIds: string[];
  createdAt: string;
}

export const seedPeople: SeedPerson[] = [
  { id: "fatih-turan", name: "Fatih Turan", email: "turan.fatih@dgpaysit.com", isCurrent: true },
  { id: "ada-lovelace", name: "Ada Lovelace", email: "ada.lovelace@example.com" },
  { id: "grace-hopper", name: "Grace Hopper", email: "grace.hopper@example.com" },
  { id: "linus-torvalds", name: "Linus Torvalds", email: "linus.torvalds@example.com" },
];

export const seedLabels: SeedLabel[] = [
  { id: "bug", name: "Bug", color: "red" },
  { id: "feature", name: "Feature", color: "blue" },
  { id: "improvement", name: "Improvement", color: "teal" },
  { id: "design", name: "Design", color: "purple" },
  { id: "docs", name: "Docs", color: "grey" },
  { id: "tech-debt", name: "Tech Debt", color: "mustard" },
  { id: "urgent-fix", name: "Urgent Fix", color: "orange" },
  { id: "performance", name: "Performance", color: "yellow" },
  { id: "security", name: "Security", color: "green" },
];

export const seedIssues: SeedIssue[] = [
  {
    id: "COR-101",
    title: "Sidebar collapse state flickers on first paint",
    description:
      "sidebarCollapsed localStorage'dan okunurken bir kare boyunca yanlış durum görünüyor.",
    status: "in-progress",
    priority: "high",
    assigneeId: "fatih-turan",
    labelIds: ["bug", "urgent-fix"],
    createdAt: "2026-08-01T09:15:00.000Z",
  },
  {
    id: "COR-102",
    title: "Add keyboard shortcut cheatsheet to command palette",
    status: "backlog",
    priority: "low",
    assigneeId: "ada-lovelace",
    labelIds: ["feature"],
    createdAt: "2026-08-02T14:02:00.000Z",
  },
  {
    id: "COR-103",
    title: "Board column header count badge miscounts when filtered",
    status: "todo",
    priority: "medium",
    labelIds: ["bug"],
    createdAt: "2026-08-02T08:40:00.000Z",
  },
  {
    id: "COR-104",
    title: "Implement dark/light theme toggle",
    status: "done",
    priority: "medium",
    assigneeId: "fatih-turan",
    labelIds: ["feature"],
    createdAt: "2026-08-03T11:20:00.000Z",
  },
  {
    id: "COR-105",
    title: "Write onboarding guide for new teammates",
    status: "backlog",
    priority: "no-priority",
    assigneeId: "grace-hopper",
    labelIds: ["docs"],
    createdAt: "2026-08-04T10:05:00.000Z",
  },
  {
    id: "COR-106",
    title: "Fix XSS vulnerability in issue description renderer",
    description:
      "Zengin metin alani sanitize edilmeden render ediliyor, script injection riski var.",
    status: "in-progress",
    priority: "urgent",
    assigneeId: "linus-torvalds",
    labelIds: ["bug", "security"],
    createdAt: "2026-08-05T16:45:00.000Z",
  },
  {
    id: "COR-107",
    title: "Redesign empty state illustrations",
    status: "canceled",
    priority: "low",
    assigneeId: "ada-lovelace",
    labelIds: ["design"],
    createdAt: "2026-08-06T13:30:00.000Z",
  },
  {
    id: "COR-108",
    title: "Optimize board re-render on drag",
    status: "todo",
    priority: "high",
    assigneeId: "fatih-turan",
    labelIds: ["performance"],
    createdAt: "2026-08-07T09:00:00.000Z",
  },
  {
    id: "COR-109",
    title: "Add tooltip delay configuration",
    status: "done",
    priority: "low",
    assigneeId: "grace-hopper",
    labelIds: ["improvement"],
    createdAt: "2026-08-07T17:10:00.000Z",
  },
  {
    id: "COR-110",
    title: "Support multi-select bulk status update",
    status: "backlog",
    priority: "medium",
    labelIds: ["feature"],
    createdAt: "2026-08-08T12:25:00.000Z",
  },
  {
    id: "COR-111",
    title: "Migrate useLocalStorageState to a generic hook",
    status: "in-progress",
    priority: "medium",
    assigneeId: "linus-torvalds",
    labelIds: ["tech-debt"],
    createdAt: "2026-08-09T08:55:00.000Z",
  },
  {
    id: "COR-112",
    title: "Fix hydration mismatch on locale switch",
    status: "done",
    priority: "high",
    assigneeId: "fatih-turan",
    labelIds: ["bug"],
    createdAt: "2026-08-10T15:40:00.000Z",
  },
  {
    id: "COR-113",
    title: "Document component API conventions",
    status: "todo",
    priority: "low",
    assigneeId: "ada-lovelace",
    labelIds: ["docs"],
    createdAt: "2026-08-11T10:15:00.000Z",
  },
  {
    id: "COR-114",
    title: "Add cycles view calendar",
    status: "backlog",
    priority: "no-priority",
    assigneeId: "grace-hopper",
    labelIds: ["feature"],
    createdAt: "2026-08-12T09:30:00.000Z",
  },
  {
    id: "COR-115",
    title: "Reduce bundle size of command palette",
    status: "done",
    priority: "medium",
    assigneeId: "linus-torvalds",
    labelIds: ["performance"],
    createdAt: "2026-08-13T14:50:00.000Z",
  },
  {
    id: "COR-116",
    title: "Explore alternative sidebar icon set",
    status: "canceled",
    priority: "no-priority",
    assigneeId: "fatih-turan",
    labelIds: ["design"],
    createdAt: "2026-08-14T11:05:00.000Z",
  },
  {
    id: "COR-117",
    title: "Polish focus ring contrast in light theme",
    status: "in-progress",
    priority: "low",
    assigneeId: "ada-lovelace",
    labelIds: ["improvement"],
    createdAt: "2026-08-15T16:20:00.000Z",
  },
  {
    id: "COR-118",
    title: "Avatar fallback color collides with destructive badge red",
    status: "todo",
    priority: "medium",
    assigneeId: "grace-hopper",
    labelIds: ["bug"],
    createdAt: "2026-08-16T09:45:00.000Z",
  },
  {
    id: "COR-119",
    title: "Audit SQLite file permissions",
    description: "data/self-board.db dosyasinin erisim izinleri gozden gecirilmeli.",
    status: "backlog",
    priority: "urgent",
    assigneeId: "linus-torvalds",
    labelIds: ["security", "bug"],
    createdAt: "2026-08-17T13:00:00.000Z",
  },
  {
    id: "COR-120",
    title: 'Add "Yeni Proje" empty state call-to-action polish',
    status: "done",
    priority: "low",
    assigneeId: "fatih-turan",
    labelIds: ["feature"],
    createdAt: "2026-08-18T10:10:00.000Z",
  },
];
