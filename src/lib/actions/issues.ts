"use server";

import { revalidatePath } from "next/cache";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import { getDb } from "@/lib/db/client";
import { deleteIssueCascade } from "@/lib/db/cascade";
import { insertIssue, updateIssueRow } from "@/lib/db/issue-writes";
import {
  cycleBelongsToProject,
  getIssueProjectId,
  isValidPriority,
  stateBelongsToProject,
  userExists,
} from "@/lib/db/validation";

export interface IssueFormValues {
  title: string;
  description: string;
  stateId: string;
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

export async function createIssue(
  projectId: string,
  input: IssueFormValues,
): Promise<ActionResult<{ id: string }>> {
  const result = insertIssue(getDb(), projectId, input);
  if (result.ok) revalidateIssueViews();
  return result;
}

export async function updateIssueState(
  issueId: string,
  stateId: string,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const projectId = getIssueProjectId(db, issueId);
  if (!projectId) return { ok: false, error: "issue-not-found" };
  // Durumlar proje başına; başka projenin durumu issue'yu listelerden düşürürdü.
  if (!stateBelongsToProject(db, stateId, projectId)) return { ok: false, error: "state-invalid" };

  db.prepare("UPDATE issues SET state_id = ? WHERE id = ?").run(stateId, issueId);

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

/** Panoda atanana göre gruplandığında sürükle-bırak bunu çağırıyor. */
export async function updateIssueAssignee(
  issueId: string,
  assigneeId: string | null,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  if (assigneeId && !userExists(db, assigneeId)) return { ok: false, error: "assignee-invalid" };

  const result = db.prepare("UPDATE issues SET assignee_id = ? WHERE id = ?").run(assigneeId, issueId);
  if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

/** Panoda cycle'a göre gruplandığında sürükle-bırak bunu çağırıyor. */
export async function updateIssueCycle(
  issueId: string,
  cycleId: string | null,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const projectId = getIssueProjectId(db, issueId);
  if (!projectId) return { ok: false, error: "issue-not-found" };
  if (cycleId && !cycleBelongsToProject(db, cycleId, projectId)) {
    return { ok: false, error: "cycle-invalid" };
  }

  db.prepare("UPDATE issues SET cycle_id = ? WHERE id = ?").run(cycleId, issueId);

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}

/** Sağ tık menüsünden tek alanlık öncelik değişikliği — tüm formu göndermeye gerek yok. */
export async function updateIssuePriority(
  issueId: string,
  priority: PriorityLevel,
): Promise<ActionResult<{ id: string }>> {
  if (!isValidPriority(priority)) return { ok: false, error: "priority-invalid" };

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
  const result = updateIssueRow(getDb(), issueId, input);
  if (result.ok) revalidateIssueViews();
  return result;
}

export async function deleteIssue(
  issueId: string,
): Promise<ActionResult<{ id: string }>> {
  const deleted = deleteIssueCascade(getDb(), issueId);
  if (!deleted) return { ok: false, error: "issue-not-found" };

  revalidateIssueViews();
  return { ok: true, data: { id: issueId } };
}
