import type { DatabaseSync } from "node:sqlite";
import { ensureSchema } from "@/lib/db/schema";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

/**
 * Yedek geri yükleme. Veritabanı dosyasının üzerine yazmak yerine yedek
 * `ATTACH` edilip içerik tablo tablo kopyalanıyor: dosyayı değiştirmek, aynı
 * dosyayı açmış başka bir bağlantı varken (Next'in ayrı route/sayfa modül
 * örnekleri, WAL dosyası) Windows'ta kilide takılıyordu. Bu yol tek bir
 * transaction içinde ve açık bağlantıyı bozmadan çalışıyor.
 *
 * Silme sırası çocuk tablolardan ebeveyne: foreign key'ler açık.
 */
const CORE_TABLES_PARENT_FIRST = [
  "users",
  "labels",
  "projects",
  "workflow_states",
  "cycles",
  "issues",
  "cycle_snapshots",
  "issue_labels",
  "issue_notes",
  "attachments",
  "link_previews",
  "views",
  "app_settings",
  "modules",
];

/**
 * Modül tabloları core'dan sonra geliyor (core tablolarına işaret ediyorlar).
 * Önceden liste sabitti: modül tabloları ve `modules` tablosunun kendisi geri
 * yüklenmiyor, hedefteki eski hâlleri olmayan projelere işaret ederek kalıyordu.
 * Fonksiyon, sabit değil: testler registry'ye sahte modül ekleyebiliyor.
 */
export function restorableTables(): string[] {
  return [...CORE_TABLES_PARENT_FIRST, ...MODULE_REGISTRY.flatMap((entry) => entry.tables ?? [])];
}

function tableNames(db: DatabaseSync, schema: string): Set<string> {
  const rows = db
    .prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table'`)
    .all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function columnNames(db: DatabaseSync, schema: string, table: string): string[] {
  const rows = db.prepare(`PRAGMA ${schema}.table_info(${table})`).all() as { name: string }[];
  return rows.map((row) => row.name);
}

/**
 * `filePath`'teki yedeği `db`'ye yükler. Yalnızca iki tarafta da var olan tablo
 * ve kolonlar kopyalanır — eski bir yedek, sonradan eklenen kolonlar için
 * varsayılanlarla yüklenir ve ardından migration'lar çalıştırılır.
 */
export function restoreFromFile(db: DatabaseSync, filePath: string): void {
  // PRAGMA transaction içinde işe yaramıyor; kopyalama sırasında tablo sırası
  // değil, yedeğin kendi tutarlılığı geçerli.
  db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.prepare("ATTACH DATABASE ? AS backup").run(filePath);
    try {
      const target = tableNames(db, "main");
      const source = tableNames(db, "backup");
      const shared = restorableTables().filter((name) => target.has(name) && source.has(name));
      // Veri yedeğin şema sürümünden geliyor; migration'lar ve onarım o sürümden
      // itibaren yeniden çalışmalı (aksi halde eski bir yedek onarımsız kalırdı).
      const sourceVersion = Number(
        (db.prepare("PRAGMA backup.user_version").get() as { user_version: number }).user_version,
      );

      db.exec("BEGIN IMMEDIATE");
      try {
        for (const table of [...shared].reverse()) db.exec(`DELETE FROM main.${table}`);

        for (const table of shared) {
          const columns = columnNames(db, "main", table).filter((column) =>
            columnNames(db, "backup", table).includes(column),
          );
          if (columns.length === 0) continue;
          const list = columns.join(", ");
          db.exec(`INSERT INTO main.${table} (${list}) SELECT ${list} FROM backup.${table}`);
        }
        db.exec(`PRAGMA user_version = ${sourceVersion}`);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    } finally {
      db.exec("DETACH DATABASE backup");
    }
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }

  // Eski sürümden gelen bir yedek güncel şemaya taşınır (ve onarımdan geçer).
  ensureSchema(db);
}
