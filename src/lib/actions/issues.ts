"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";
import { getDb } from "@/lib/db/client";
import { linkAttachmentsToIssue, syncIssueAttachments } from "@/lib/db/attachment-links";

export interface IssueFormValues {
  title: string;
  description: string;
  status: StatusState;
  priority: PriorityLevel;
  assigneeId: string | null;
  cycleId: string | null;
  labelIds: string[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Bir issue değiştiğinde bayatlayan her route. Daha önce yalnızca `/issues`
 * yenileniyordu; `/my-issues` aynı issue'ları, `/cycles` ise onların türetilmiş
 * sayımlarını gösterdiği için o sayfalara geçildiğinde eski veri görünüyordu.
 */
function revalidateIssueViews(): void {
  revalidatePath("/issues");
  revalidatePath("/my-issues");
  revalidatePath("/cycles");
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

export async function createIssue(
  projectId: string,
  input: IssueFormValues,
): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title-required" };

  const db = getDb();
  const project = db.prepare("SELECT prefix FROM projects WHERE id = ?").get(projectId) as
    | { prefix: string }
    | undefined;
  if (!project) return { ok: false, error: "project-not-found" };

  const createdAt = new Date().toISOString();

  // Sayaç artırma, issue satırı ve label'ları tek transaction — ortada bir hata
  // olursa yarım issue ya da boşa harcanmış bir numara kalmasın.
  db.exec("BEGIN");
  let id: string;
  try {
    id = getNextIssueId(db, projectId, project.prefix);

    db.prepare(
      `INSERT INTO issues (id, project_id, cycle_id, title, description, status, priority, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      projectId,
      input.cycleId,
      title,
      input.description.trim() || null,
      input.status,
      input.priority,
      input.assigneeId,
      createdAt,
    );

    if (input.labelIds.length > 0) {
      const insertLabel = db.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)");
      for (const labelId of input.labelIds) insertLabel.run(id, labelId);
    }

    linkAttachmentsToIssue(db, id, [input.description]);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateIssueViews();
  return { ok: true, data: { id } };
}

export async function updateIssueStatus(
  issueId: string,
  status: StatusState,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db.prepare("UPDATE issues SET status = ? WHERE id = ?").run(status, issueId);

  if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

/** Sağ tık menüsünden tek alanlık öncelik değişikliği — tüm formu göndermeye gerek yok. */
export async function updateIssuePriority(
  issueId: string,
  priority: PriorityLevel,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db.prepare("UPDATE issues SET priority = ? WHERE id = ?").run(priority, issueId);

  if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

export async function updateIssue(
  issueId: string,
  input: IssueFormValues,
): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title-required" };

  const db = getDb();
  const description = input.description.trim() || null;

  // Issue satırı, label'ların silinip yeniden yazılması ve attachment eşitlemesi
  // tek transaction — arada bir hata olursa issue label'sız kalmasın.
  db.exec("BEGIN");
  let changed: number;
  try {
    const result = db
      .prepare(
        `UPDATE issues SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, cycle_id = ? WHERE id = ?`,
      )
      .run(
        title,
        description,
        input.status,
        input.priority,
        input.assigneeId,
        input.cycleId,
        issueId,
      );
    changed = Number(result.changes);

    if (changed > 0) {
      db.prepare("DELETE FROM issue_labels WHERE issue_id = ?").run(issueId);
      if (input.labelIds.length > 0) {
        const insertLabel = db.prepare(
          "INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)",
        );
        for (const labelId of input.labelIds) insertLabel.run(issueId, labelId);
      }
      syncIssueAttachments(db, issueId, description);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  if (changed === 0) return { ok: false, error: "issue-not-found" };

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

export async function deleteIssue(
  issueId: string,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM issue_labels WHERE issue_id = ?").run(issueId);
    db.prepare("DELETE FROM issue_notes WHERE issue_id = ?").run(issueId);
    db.prepare("DELETE FROM attachments WHERE issue_id = ?").run(issueId);
    const result = db.prepare("DELETE FROM issues WHERE id = ?").run(issueId);
    db.exec("COMMIT");

    if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}
