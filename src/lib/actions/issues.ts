"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";
import { TEAMS } from "@/lib/app-shell-data";
import { getDb } from "@/lib/db/client";
import { linkAttachmentsToIssue } from "@/lib/db/attachment-links";

export interface IssueFormValues {
  title: string;
  description: string;
  status: StatusState;
  priority: PriorityLevel;
  assigneeId: string | null;
  labelIds: string[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function getNextIssueId(db: DatabaseSync, teamId: string, prefix: string): string {
  const rows = db.prepare("SELECT id FROM issues WHERE team_id = ?").all(teamId) as {
    id: string;
  }[];
  const maxNum = rows.reduce((max, row) => {
    const match = /-(\d+)$/.exec(row.id);
    const n = match ? Number(match[1]) : 0;
    return n > max ? n : max;
  }, 0);
  return `${prefix}-${maxNum + 1}`;
}

export async function createIssue(
  teamId: string,
  input: IssueFormValues,
): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title-required" };

  const team = TEAMS.find((t) => t.slug === teamId);
  if (!team) return { ok: false, error: "team-not-found" };

  const db = getDb();
  const id = getNextIssueId(db, teamId, team.prefix);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO issues (id, team_id, title, description, status, priority, assignee_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    teamId,
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

  revalidatePath(`/team/${teamId}/issues`);
  return { ok: true, data: { id } };
}

export async function updateIssueStatus(
  issueId: string,
  teamId: string,
  status: StatusState,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db.prepare("UPDATE issues SET status = ? WHERE id = ?").run(status, issueId);

  if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };

  revalidatePath(`/team/${teamId}/issues`);
  return { ok: true, data: { id: issueId } };
}

export async function updateIssue(
  issueId: string,
  teamId: string,
  input: IssueFormValues,
): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title-required" };

  const db = getDb();
  const result = db
    .prepare(
      `UPDATE issues SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ? WHERE id = ?`,
    )
    .run(
      title,
      input.description.trim() || null,
      input.status,
      input.priority,
      input.assigneeId,
      issueId,
    );

  if (Number(result.changes) === 0) return { ok: false, error: "issue-not-found" };

  db.prepare("DELETE FROM issue_labels WHERE issue_id = ?").run(issueId);
  if (input.labelIds.length > 0) {
    const insertLabel = db.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)");
    for (const labelId of input.labelIds) insertLabel.run(issueId, labelId);
  }

  linkAttachmentsToIssue(db, issueId, [input.description]);

  revalidatePath(`/team/${teamId}/issues`);
  return { ok: true, data: { id: issueId } };
}

export async function deleteIssue(
  issueId: string,
  teamId: string,
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

  revalidatePath(`/team/${teamId}/issues`);
  return { ok: true, data: { id: issueId } };
}
