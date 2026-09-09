"use server";

import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const ORPHAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Hiçbir issue'ya bağlanmamış (kaydedilmeden bırakılmış) attachment'ları belirli bir yaştan sonra siler. */
function pruneOrphanedAttachments(db: DatabaseSync): void {
  const cutoff = new Date(Date.now() - ORPHAN_MAX_AGE_MS).toISOString();
  db.prepare("DELETE FROM attachments WHERE issue_id IS NULL AND created_at < ?").run(cutoff);
}

export async function uploadAttachment(
  base64: string,
  mimeType: string,
): Promise<ActionResult<{ id: string; url: string }>> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) return { ok: false, error: "unsupported-type" };

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0) return { ok: false, error: "empty-file" };
  if (buffer.byteLength > MAX_BYTES) return { ok: false, error: "file-too-large" };

  const db = getDb();
  pruneOrphanedAttachments(db);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare("INSERT INTO attachments (id, mime_type, data, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    mimeType,
    buffer,
    createdAt,
  );

  return { ok: true, data: { id, url: `/api/attachments/${id}` } };
}
