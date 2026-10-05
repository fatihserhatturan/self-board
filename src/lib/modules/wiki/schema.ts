import type { DatabaseSync } from "node:sqlite";

/**
 * Wiki modülünün registry'ye açılan yüzü. Bu dosya client bundle'ına giriyor
 * (bkz. `lib/modules/registry.ts` import kuralı): yalnız `import type`, saf
 * sabitler ve `db` parametresi alan saf fonksiyonlar. Sunucu tarafı yazma ve
 * okuma mantığı `./db.ts`'te.
 */

export const WIKI_MODULE_ID = "wiki";

/** Başlık otomatik kaydedildiği için boş olabiliyor; üst sınır yalnız kötüye kullanıma karşı. */
export const WIKI_TITLE_MAX_LENGTH = 200;

/** Ebeveyn önce — yedekleme/geri yükleme bu sırayla kopyalıyor. */
export const WIKI_TABLES = ["wiki_pages", "wiki_page_attachments"] as const;

/**
 * Wiki'nin kullandığı ekler. Core bunları silmiyor: wiki görselleri hiçbir
 * issue'ya bağlı olmadığı için aksi halde 24 saat sonra yetim sayılırdı.
 */
export const WIKI_ATTACHMENT_REFS_SQL = "SELECT attachment_id FROM wiki_page_attachments";

/**
 * Sayfalar proje başına bir ağaç: `parent_id` NULL olanlar kök. `title`/`body`
 * NULL olamaz ama boş olabilir — yazarken kaydedilen bir sayfanın başlığı bir
 * an boş kalabilir, bunu "başlık zorunlu" diye reddetmek kaydı bozardı.
 * `updated_at` yalnız başlık/gövde değişince ilerliyor; taşıma ve sıralama
 * içerik değişikliği değil.
 *
 * Görseller için ayrı bir eşleme tablosu: core'un `attachments` tablosuna
 * kolon eklemek modülü core şemasına bağlardı.
 */
export const WIKI_DDL = `
CREATE TABLE IF NOT EXISTS wiki_pages (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id  TEXT REFERENCES wiki_pages(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_tree ON wiki_pages(project_id, parent_id, position);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated ON wiki_pages(project_id, updated_at);

CREATE TABLE IF NOT EXISTS wiki_page_attachments (
  page_id       TEXT NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  attachment_id TEXT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, attachment_id)
);
CREATE INDEX IF NOT EXISTS idx_wiki_page_attachments_att ON wiki_page_attachments(attachment_id);
`;

/**
 * Proje silinirken wiki verisini temizler (`deleteProjectCascade` çağırıyor).
 * Görsel BLOB'larına dokunmuyor: eşleme silinince sahipsiz kalanları core'un
 * ek temizliği topluyor — "başka biri kullanıyor mu" sorusu tek yerde.
 */
export function deleteWikiProjectData(db: DatabaseSync, projectId: string): void {
  db.prepare(
    "DELETE FROM wiki_page_attachments WHERE page_id IN (SELECT id FROM wiki_pages WHERE project_id = ?)",
  ).run(projectId);
  db.prepare("DELETE FROM wiki_pages WHERE project_id = ?").run(projectId);
}
