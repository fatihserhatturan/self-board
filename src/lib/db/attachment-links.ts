import type { DatabaseSync } from "node:sqlite";

const ATTACHMENT_URL_RE = /\/api\/attachments\/([a-f0-9-]{36})/g;

/** Bir HTML gövdesinde referans edilen attachment id'lerini çıkarır (Tiptap `<img src="...">`). */
export function extractAttachmentIds(html: string): string[] {
  return [...html.matchAll(ATTACHMENT_URL_RE)].map((match) => match[1]);
}

/**
 * Bir issue'nun description/note gövdelerinde referans edilen attachment'ları o issue'ya bağlar.
 * First-writer-wins: zaten bir issue'ya bağlı attachment yeniden ebeveynlenmez.
 */
export function linkAttachmentsToIssue(
  db: DatabaseSync,
  issueId: string,
  htmlBodies: (string | null | undefined)[],
): void {
  const ids = new Set(
    htmlBodies.filter((body): body is string => Boolean(body)).flatMap(extractAttachmentIds),
  );
  if (ids.size === 0) return;

  const stmt = db.prepare("UPDATE attachments SET issue_id = ? WHERE id = ? AND issue_id IS NULL");
  for (const id of ids) stmt.run(issueId, id);
}
