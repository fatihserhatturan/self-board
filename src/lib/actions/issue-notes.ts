"use server";

import { getDb } from "@/lib/db/client";
import { linkAttachmentsToIssue } from "@/lib/db/attachment-links";
import type { IssueNote } from "@/lib/data/issue-notes";
import type { ActionResult } from "@/lib/actions/issues";

function asString(value: unknown): string {
  return String(value);
}

export async function getIssueNotes(issueId: string): Promise<IssueNote[]> {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, issue_id, body, created_at FROM issue_notes WHERE issue_id = ? ORDER BY created_at ASC",
    )
    .all(issueId);
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: asString(r.id),
      issueId: asString(r.issue_id),
      body: asString(r.body),
      createdAt: asString(r.created_at),
    };
  });
}

export async function addIssueNote(
  issueId: string,
  body: string,
): Promise<ActionResult<IssueNote>> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "body-required" };

  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare("INSERT INTO issue_notes (id, issue_id, body, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    issueId,
    trimmed,
    createdAt,
  );

  linkAttachmentsToIssue(db, issueId, [trimmed]);

  return { ok: true, data: { id, issueId, body: trimmed, createdAt } };
}

export async function deleteIssueNote(noteId: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db.prepare("DELETE FROM issue_notes WHERE id = ?").run(noteId);

  if (Number(result.changes) === 0) return { ok: false, error: "note-not-found" };
  return { ok: true, data: { id: noteId } };
}
