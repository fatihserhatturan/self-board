import type { DatabaseSync } from "node:sqlite";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import { STATUS_TYPES, type StatusType } from "@/lib/board/workflow-config";
import { priorityLevels } from "@/lib/token-manifest";

/**
 * Server Action girdilerinin doğrulaması. Action'lar herkese açık HTTP uç
 * noktaları; TypeScript tipleri çalışma anında hiçbir şeyi garanti etmiyor.
 * Doğrulanmayan bir `stateId` issue'yu hiçbir listede görünmez hâle
 * getiriyordu (`getIssues` durumlara INNER JOIN yapıyor), geçersiz bir öncelik
 * ise CHECK kısıtına çarpıp yakalanmamış bir exception'a dönüşüyordu.
 *
 * `"use server"` dosyaları yalnızca async fonksiyon export edebildiği için bu
 * yardımcılar ayrı bir modülde.
 */

export function isValidPriority(value: unknown): value is PriorityLevel {
  return typeof value === "string" && (priorityLevels as readonly string[]).includes(value);
}

export function isValidStatusType(value: unknown): value is StatusType {
  return typeof value === "string" && (STATUS_TYPES as string[]).includes(value);
}

export function isValidLayout(value: unknown): value is "list" | "board" {
  return value === "list" || value === "board";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function projectExists(db: DatabaseSync, projectId: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM projects WHERE id = ?").get(projectId));
}

export function issueExists(db: DatabaseSync, issueId: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM issues WHERE id = ?").get(issueId));
}

export function userExists(db: DatabaseSync, userId: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM users WHERE id = ?").get(userId));
}

export function stateBelongsToProject(
  db: DatabaseSync,
  stateId: string,
  projectId: string,
): boolean {
  return Boolean(
    db
      .prepare("SELECT 1 FROM workflow_states WHERE id = ? AND project_id = ?")
      .get(stateId, projectId),
  );
}

export function cycleBelongsToProject(
  db: DatabaseSync,
  cycleId: string,
  projectId: string,
): boolean {
  return Boolean(
    db.prepare("SELECT 1 FROM cycles WHERE id = ? AND project_id = ?").get(cycleId, projectId),
  );
}

/** Var olmayan etiket id'lerini (silinmiş, uydurma) atar; tekrarları da temizler. */
export function filterExistingLabelIds(db: DatabaseSync, labelIds: string[]): string[] {
  const unique = [...new Set(labelIds)];
  if (unique.length === 0) return [];
  const rows = db
    .prepare(`SELECT id FROM labels WHERE id IN (${unique.map(() => "?").join(",")})`)
    .all(...unique) as { id: string }[];
  const existing = new Set(rows.map((row) => row.id));
  return unique.filter((id) => existing.has(id));
}

export function getIssueProjectId(db: DatabaseSync, issueId: string): string | null {
  const row = db.prepare("SELECT project_id FROM issues WHERE id = ?").get(issueId) as
    | { project_id: string }
    | undefined;
  return row?.project_id ?? null;
}
