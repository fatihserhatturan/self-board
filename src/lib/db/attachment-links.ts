import type { DatabaseSync } from "node:sqlite";

const ATTACHMENT_URL_RE = /\/api\/attachments\/([a-f0-9-]{36})/g;
const ORPHAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Hiçbir issue'ya bağlanmamış (kaydedilmeden bırakılmış) attachment'ları belirli
 * bir yaştan sonra siler. Yeni yüklemede ve uygulama açılışında çalışıyor —
 * yalnızca yüklemeye bağlıyken, bir daha görsel yüklenmezse hiç çalışmıyordu.
 */
export function pruneOrphanedAttachments(db: DatabaseSync, now = Date.now()): void {
  const cutoff = new Date(now - ORPHAN_MAX_AGE_MS).toISOString();
  db.prepare("DELETE FROM attachments WHERE issue_id IS NULL AND created_at < ?").run(cutoff);
}

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

/**
 * Bir issue kaydedilirken attachment'larını gövdelerle eşitler: yeni
 * referanslar bağlanır, artık hiçbir gövdede geçmeyen ama bu issue'ya bağlı
 * olan BLOB'lar silinir. Önceki temizlik yalnızca hiç bağlanmamış kayıtları
 * kapsadığı için açıklamadan silinen bir görsel DB'de sonsuza kadar kalıyordu.
 * Notlar da referans sayıldığı için gövdeleri buradan okunuyor.
 */
export function syncIssueAttachments(
  db: DatabaseSync,
  issueId: string,
  description: string | null | undefined,
): void {
  const noteRows = db
    .prepare("SELECT body FROM issue_notes WHERE issue_id = ?")
    .all(issueId) as { body: string }[];

  const referenced = new Set(
    [description ?? "", ...noteRows.map((row) => row.body)].flatMap(extractAttachmentIds),
  );

  const link = db.prepare("UPDATE attachments SET issue_id = ? WHERE id = ? AND issue_id IS NULL");
  for (const id of referenced) link.run(issueId, id);

  const owned = db
    .prepare("SELECT id FROM attachments WHERE issue_id = ?")
    .all(issueId) as { id: string }[];
  const remove = db.prepare("DELETE FROM attachments WHERE id = ?");
  for (const row of owned) {
    if (!referenced.has(row.id)) remove.run(row.id);
  }
}
