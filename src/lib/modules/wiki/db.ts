import type { DatabaseSync } from "node:sqlite";
import type { Route } from "next";
import { extractAttachmentIds } from "@/lib/db/attachment-links";
import type { WriteResult } from "@/lib/db/issue-writes";
import { projectExists } from "@/lib/db/validation";
import type { ModuleSearchEntry } from "@/lib/modules/registry";
import { WIKI_MODULE_ID, WIKI_TITLE_MAX_LENGTH } from "@/lib/modules/wiki/schema";
import type { WikiTreeNode } from "@/lib/modules/wiki/tree";

/**
 * Wiki okuma/yazma mantığı — `db` parametresi alan saf fonksiyonlar
 * (`lib/db/issue-writes.ts` deseni), action'lar bunları sarıyor. Yalnız
 * sunucuda: registry'den import EDİLMEMELİ (bkz. `lib/modules/registry.ts`).
 *
 * Kök sayfalar `parent_id IS NULL`; sorgular `parent_id IS ?` kullanıyor —
 * `=` NULL ile hiçbir zaman eşleşmez.
 */

export interface WikiPage {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface PageRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  position: number;
}

function inTransaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec("BEGIN");
  try {
    const result = run();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function readPageRow(db: DatabaseSync, pageId: string): PageRow | undefined {
  return db
    .prepare("SELECT id, project_id, parent_id, position FROM wiki_pages WHERE id = ?")
    .get(pageId) as PageRow | undefined;
}

/** Bir ebeveynin (ya da kökün) çocukları arasında sonraki pozisyon. */
function nextPosition(db: DatabaseSync, projectId: string, parentId: string | null): number {
  const { next } = db
    .prepare(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM wiki_pages WHERE project_id = ? AND parent_id IS ?",
    )
    .get(projectId, parentId) as { next: number };
  return Number(next);
}

function normalizeTitle(title: unknown): string {
  return (typeof title === "string" ? title : "").trim().slice(0, WIKI_TITLE_MAX_LENGTH);
}

/** Ağaç için tüm sayfalar, gövdesiz — gövdeler yalnız açılan sayfa için okunuyor. */
export function listWikiTreeDb(db: DatabaseSync, projectId: string): WikiTreeNode[] {
  const rows = db
    .prepare(
      `SELECT id, parent_id, title, position, updated_at FROM wiki_pages
       WHERE project_id = ? ORDER BY position ASC, created_at ASC`,
    )
    .all(projectId) as {
    id: string;
    parent_id: string | null;
    title: string;
    position: number;
    updated_at: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    position: Number(row.position),
    updatedAt: row.updated_at,
  }));
}

export function readWikiPageDb(db: DatabaseSync, pageId: string): WikiPage | null {
  const row = db
    .prepare(
      "SELECT id, project_id, parent_id, title, body, created_at, updated_at FROM wiki_pages WHERE id = ?",
    )
    .get(pageId) as
    | {
        id: string;
        project_id: string;
        parent_id: string | null;
        title: string;
        body: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    parentId: row.parent_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Komut paleti için tüm projelerin sayfa başlıkları, son düzenlenen önce. */
export function listWikiSearchEntriesDb(db: DatabaseSync): ModuleSearchEntry[] {
  const rows = db
    .prepare("SELECT id, title, project_id FROM wiki_pages ORDER BY updated_at DESC")
    .all() as { id: string; title: string; project_id: string }[];
  return rows.map((row) => ({
    moduleId: WIKI_MODULE_ID,
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    href: `/wiki?project=${row.project_id}&page=${row.id}` as Route,
  }));
}

/** Boş bir sayfa oluşturur: kökte ya da `parentId`'nin altında, kardeşlerin sonunda. */
export function insertWikiPageDb(
  db: DatabaseSync,
  projectId: string,
  parentId: string | null,
  now = new Date(),
): WriteResult<{ id: string }> {
  if (!projectExists(db, projectId)) return { ok: false, error: "project-not-found" };
  if (parentId) {
    const parent = readPageRow(db, parentId);
    if (!parent || parent.project_id !== projectId) return { ok: false, error: "parent-not-found" };
  }

  const id = crypto.randomUUID();
  const timestamp = now.toISOString();
  db.prepare(
    `INSERT INTO wiki_pages (id, project_id, parent_id, title, body, position, created_at, updated_at)
     VALUES (?, ?, ?, '', '', ?, ?, ?)`,
  ).run(id, projectId, parentId, nextPosition(db, projectId, parentId), timestamp, timestamp);
  return { ok: true, data: { id } };
}

/**
 * Sayfanın gövdesinde geçen ekleri eşleme tablosuna yazar; gövdeden çıkanların
 * eşlemesi silinir. BLOB'lar silinmez — sahipsiz kalanı core'un ek temizliği
 * topluyor. `SELECT … FROM attachments` ile yalnız var olan ekler eşleniyor:
 * kopyalanmış eski bir HTML'deki silinmiş bir görsel FK hatası üretmesin.
 */
export function syncWikiPageAttachmentsDb(db: DatabaseSync, pageId: string, body: string): void {
  db.prepare("DELETE FROM wiki_page_attachments WHERE page_id = ?").run(pageId);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO wiki_page_attachments (page_id, attachment_id) SELECT ?, id FROM attachments WHERE id = ?",
  );
  for (const attachmentId of new Set(extractAttachmentIds(body))) insert.run(pageId, attachmentId);
}

/**
 * Başlık ve gövdeyi yazar. Gerçekten bir şey değişmediyse `updated_at`
 * ilerlemez — otomatik kaydetme aynı içeriği yeniden gönderse bile "son
 * düzenleme" yalan söylemesin.
 */
export function updateWikiPageContentDb(
  db: DatabaseSync,
  pageId: string,
  input: { title: string; body: string },
  now = new Date(),
): WriteResult<{ updatedAt: string }> {
  const title = normalizeTitle(input.title);
  const body = typeof input.body === "string" ? input.body : "";
  const timestamp = now.toISOString();

  return inTransaction(db, () => {
    const result = db
      .prepare(
        `UPDATE wiki_pages SET title = ?, body = ?, updated_at = ?
         WHERE id = ? AND (title <> ? OR body <> ?)`,
      )
      .run(title, body, timestamp, pageId, title, body);

    if (Number(result.changes) === 0) {
      const existing = db.prepare("SELECT updated_at FROM wiki_pages WHERE id = ?").get(pageId) as
        | { updated_at: string }
        | undefined;
      if (!existing) return { ok: false, error: "page-not-found" };
      return { ok: true, data: { updatedAt: existing.updated_at } };
    }

    syncWikiPageAttachmentsDb(db, pageId, body);
    return { ok: true, data: { updatedAt: timestamp } };
  });
}

/** Sayfayı kardeşleri arasında bir sıra yukarı/aşağı taşır (`moveWorkflowState` deseni). */
export function moveWikiPageDb(
  db: DatabaseSync,
  pageId: string,
  direction: "up" | "down",
): WriteResult<{ id: string }> {
  const page = readPageRow(db, pageId);
  if (!page) return { ok: false, error: "page-not-found" };

  const neighbour = db
    .prepare(
      direction === "up"
        ? "SELECT id, position FROM wiki_pages WHERE project_id = ? AND parent_id IS ? AND position < ? ORDER BY position DESC LIMIT 1"
        : "SELECT id, position FROM wiki_pages WHERE project_id = ? AND parent_id IS ? AND position > ? ORDER BY position ASC LIMIT 1",
    )
    .get(page.project_id, page.parent_id, page.position) as
    | { id: string; position: number }
    | undefined;
  if (!neighbour) return { ok: true, data: { id: pageId } };

  const update = db.prepare("UPDATE wiki_pages SET position = ? WHERE id = ?");
  inTransaction(db, () => {
    update.run(neighbour.position, pageId);
    update.run(page.position, neighbour.id);
  });
  return { ok: true, data: { id: pageId } };
}

/**
 * Sayfa ve tüm torunları. `UNION` (`UNION ALL` değil): bozuk veride bir döngü
 * olsa bile sorgu sonlanır.
 */
export function wikiSubtreeIdsDb(db: DatabaseSync, pageId: string): string[] {
  const rows = db
    .prepare(
      `WITH RECURSIVE subtree(id) AS (
         SELECT id FROM wiki_pages WHERE id = ?
         UNION
         SELECT p.id FROM wiki_pages p JOIN subtree s ON p.parent_id = s.id
       )
       SELECT id FROM subtree`,
    )
    .all(pageId) as { id: string }[];
  return rows.map((row) => row.id);
}

/**
 * Sayfayı başka bir sayfanın altına (ya da köke) taşır, yeni kardeşlerinin
 * sonuna. Sayfa kendi altına ya da bir torununun altına taşınamaz — ağaç
 * döngüye girerdi. İçerik değişmediği için `updated_at` ilerlemez.
 */
export function reparentWikiPageDb(
  db: DatabaseSync,
  pageId: string,
  newParentId: string | null,
): WriteResult<{ id: string }> {
  const page = readPageRow(db, pageId);
  if (!page) return { ok: false, error: "page-not-found" };
  if (page.parent_id === newParentId) return { ok: true, data: { id: pageId } };

  if (newParentId) {
    const parent = readPageRow(db, newParentId);
    if (!parent || parent.project_id !== page.project_id) {
      return { ok: false, error: "parent-not-found" };
    }
    if (wikiSubtreeIdsDb(db, pageId).includes(newParentId)) {
      return { ok: false, error: "parent-cycle" };
    }
  }

  db.prepare("UPDATE wiki_pages SET parent_id = ?, position = ? WHERE id = ?").run(
    newParentId,
    nextPosition(db, page.project_id, newParentId),
    pageId,
  );
  return { ok: true, data: { id: pageId } };
}

/**
 * Sayfayı tüm alt sayfalarıyla siler (Notion'daki gibi). Eşlemeler ve sayfalar
 * açıkça, en derindekinden başlayarak siliniyor; BLOB'ları core'un ek
 * temizliği topluyor.
 */
export function deleteWikiPageSubtreeDb(
  db: DatabaseSync,
  pageId: string,
): WriteResult<{ deletedIds: string[] }> {
  const ids = wikiSubtreeIdsDb(db, pageId);
  if (ids.length === 0) return { ok: false, error: "page-not-found" };

  const deleteRefs = db.prepare("DELETE FROM wiki_page_attachments WHERE page_id = ?");
  const deletePage = db.prepare("DELETE FROM wiki_pages WHERE id = ?");
  inTransaction(db, () => {
    // CTE ebeveynden çocuğa doğru üretiyor; ters sırada çocuklar önce gidiyor.
    for (const id of [...ids].reverse()) {
      deleteRefs.run(id);
      deletePage.run(id);
    }
  });
  return { ok: true, data: { deletedIds: ids } };
}
