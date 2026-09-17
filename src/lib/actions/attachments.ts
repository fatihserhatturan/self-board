"use server";

import { getDb } from "@/lib/db/client";
import { pruneOrphanedAttachments } from "@/lib/db/attachment-links";
import type { ActionResult } from "@/lib/actions/issues";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

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
