"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import type { ActionResult } from "@/lib/actions/issues";
import { pruneOrphanedAttachments } from "@/lib/db/attachment-links";
import { getDb } from "@/lib/db/client";
import { getEnabledModuleIdsDb } from "@/lib/db/modules";
import {
  deleteWikiPageSubtreeDb,
  insertWikiPageDb,
  moveWikiPageDb,
  reparentWikiPageDb,
  updateWikiPageContentDb,
} from "@/lib/modules/wiki/db";
import { WIKI_MODULE_ID } from "@/lib/modules/wiki/schema";

/**
 * Wiki yazma action'ları. Modül kapalıyken hiçbiri çalışmıyor — sayfa rotası
 * 404 veriyor ama action'lar herkese açık uç noktalar.
 *
 * Her yazma `/wiki`'yi revalidate ediyor, otomatik kaydetme dahil: etmeseydi
 * tarayıcının Geri tuşu önbellekteki eski sayfayı getirir, kullanıcı onun
 * üstüne yazmaya devam edince yeni içerik sessizce ezilirdi. Revalidate'in
 * editörün içeriğini geri sarmaması editör tarafında çözülüyor (içerik
 * bağlandığı anda donduruluyor — bkz. `components/wiki/wiki-page-editor.tsx`).
 */

function withWiki<T>(run: (db: DatabaseSync) => ActionResult<T>): ActionResult<T> {
  const db = getDb();
  if (!getEnabledModuleIdsDb(db).includes(WIKI_MODULE_ID)) {
    return { ok: false, error: "module-disabled" };
  }
  const result = run(db);
  if (result.ok) revalidatePath("/wiki");
  return result;
}

export async function createWikiPage(
  projectId: string,
  parentId: string | null,
): Promise<ActionResult<{ id: string }>> {
  return withWiki((db) => insertWikiPageDb(db, projectId, parentId));
}

export async function saveWikiPage(
  pageId: string,
  input: { title: string; body: string },
): Promise<ActionResult<{ updatedAt: string }>> {
  return withWiki((db) => updateWikiPageContentDb(db, pageId, input));
}

export async function moveWikiPage(
  pageId: string,
  direction: "up" | "down",
): Promise<ActionResult<{ id: string }>> {
  if (direction !== "up" && direction !== "down") return { ok: false, error: "direction-invalid" };
  return withWiki((db) => moveWikiPageDb(db, pageId, direction));
}

export async function reparentWikiPage(
  pageId: string,
  newParentId: string | null,
): Promise<ActionResult<{ id: string }>> {
  return withWiki((db) => reparentWikiPageDb(db, pageId, newParentId));
}

/** Alt sayfalarıyla birlikte siler; artık hiçbir yerde kullanılmayan eski görseller hemen toplanır. */
export async function deleteWikiPage(
  pageId: string,
): Promise<ActionResult<{ deletedIds: string[] }>> {
  return withWiki((db) => {
    const result = deleteWikiPageSubtreeDb(db, pageId);
    if (result.ok) pruneOrphanedAttachments(db);
    return result;
  });
}
