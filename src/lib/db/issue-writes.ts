import type { DatabaseSync } from "node:sqlite";
import type { IssueFormValues } from "@/lib/actions/issues";
import { linkAttachmentsToIssue, syncIssueAttachments } from "@/lib/db/attachment-links";
import {
  cycleBelongsToProject,
  filterExistingLabelIds,
  isValidPriority,
  stateBelongsToProject,
  userExists,
} from "@/lib/db/validation";

/**
 * Issue yazma mantığı `db` parametresi alan saf fonksiyonlar olarak burada —
 * Server Action'lar `revalidatePath` çağırdığı için doğrudan test edilemiyor,
 * action'lar bu fonksiyonları sarıyor.
 */

export type WriteResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Formun proje bağlamında geçerli olup olmadığını kontrol eder ve etiketleri
 * var olanlara indirger. Durum ve cycle başka bir projeye ait olamaz.
 */
export function validateIssueInput(
  db: DatabaseSync,
  projectId: string,
  input: IssueFormValues,
): WriteResult<{ title: string; labelIds: string[] }> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "title-required" };
  if (!isValidPriority(input.priority)) return { ok: false, error: "priority-invalid" };
  if (!input.stateId || !stateBelongsToProject(db, input.stateId, projectId)) {
    return { ok: false, error: "state-invalid" };
  }
  if (input.cycleId && !cycleBelongsToProject(db, input.cycleId, projectId)) {
    return { ok: false, error: "cycle-invalid" };
  }
  if (input.assigneeId && !userExists(db, input.assigneeId)) {
    return { ok: false, error: "assignee-invalid" };
  }
  const labelIds = Array.isArray(input.labelIds) ? filterExistingLabelIds(db, input.labelIds) : [];
  return { ok: true, data: { title, labelIds } };
}

/**
 * Projenin monoton sayacını bir artırıp yeni id'yi üretir. Sayaç issue
 * satırlarından değil `projects.issue_seq`'ten okunuyor: silinen bir issue'nun
 * numarası bir daha dağıtılmaz. Çağıran taraf açık bir transaction içinde.
 */
function getNextIssueId(db: DatabaseSync, projectId: string, prefix: string): string {
  db.prepare("UPDATE projects SET issue_seq = issue_seq + 1 WHERE id = ?").run(projectId);
  const { issue_seq: next } = db
    .prepare("SELECT issue_seq FROM projects WHERE id = ?")
    .get(projectId) as { issue_seq: number };
  return `${prefix}-${next}`;
}

export function insertIssue(
  db: DatabaseSync,
  projectId: string,
  input: IssueFormValues,
): WriteResult<{ id: string }> {
  const project = db.prepare("SELECT prefix FROM projects WHERE id = ?").get(projectId) as
    | { prefix: string }
    | undefined;
  if (!project) return { ok: false, error: "project-not-found" };

  const validated = validateIssueInput(db, projectId, input);
  if (!validated.ok) return validated;

  const description = (input.description ?? "").trim() || null;
  const createdAt = new Date().toISOString();

  // Sayaç artırma, issue satırı ve label'lar tek transaction — ortada bir hata
  // olursa yarım issue ya da boşa harcanmış bir numara kalmasın.
  db.exec("BEGIN");
  let id: string;
  try {
    id = getNextIssueId(db, projectId, project.prefix);

    db.prepare(
      `INSERT INTO issues (id, project_id, cycle_id, title, description, state_id, priority, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      projectId,
      input.cycleId ?? null,
      validated.data.title,
      description,
      input.stateId,
      input.priority,
      input.assigneeId ?? null,
      createdAt,
    );

    const insertLabel = db.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)");
    for (const labelId of validated.data.labelIds) insertLabel.run(id, labelId);

    linkAttachmentsToIssue(db, id, [description]);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return { ok: true, data: { id } };
}

export function updateIssueRow(
  db: DatabaseSync,
  issueId: string,
  input: IssueFormValues,
): WriteResult<{ id: string }> {
  const row = db.prepare("SELECT project_id FROM issues WHERE id = ?").get(issueId) as
    | { project_id: string }
    | undefined;
  if (!row) return { ok: false, error: "issue-not-found" };

  const validated = validateIssueInput(db, row.project_id, input);
  if (!validated.ok) return validated;

  const description = (input.description ?? "").trim() || null;

  // Issue satırı, label'ların silinip yeniden yazılması ve attachment eşitlemesi
  // tek transaction — arada bir hata olursa issue label'sız kalmasın.
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE issues SET title = ?, description = ?, state_id = ?, priority = ?, assignee_id = ?, cycle_id = ? WHERE id = ?`,
    ).run(
      validated.data.title,
      description,
      input.stateId,
      input.priority,
      input.assigneeId ?? null,
      input.cycleId ?? null,
      issueId,
    );

    db.prepare("DELETE FROM issue_labels WHERE issue_id = ?").run(issueId);
    const insertLabel = db.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)");
    for (const labelId of validated.data.labelIds) insertLabel.run(issueId, labelId);

    syncIssueAttachments(db, issueId, description);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return { ok: true, data: { id: issueId } };
}
