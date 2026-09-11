import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureSchema, seedIfEmpty } from "@/lib/db/schema";

let db: DatabaseSync | null = null;

/**
 * Veritabanı dosyasının tam yolu. Paketlenmiş Electron uygulaması
 * `SELF_BOARD_DB_DIR`'i userData dizinine ayarlar; aksi halde proje kökündeki
 * `data/` kullanılır. Ayarlar > Hakkında sayfası bu yolu gösteriyor.
 */
export function getDbPath(): string {
  const dbDir = process.env.SELF_BOARD_DB_DIR ?? path.join(process.cwd(), "data");
  return path.join(dbDir, "self-board.db");
}

/** Lazy-açılan SQLite singleton'ı. `src/lib/data/*` ve `src/lib/actions/*` tarafından kullanılıyor. */
export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = getDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(db);
  seedIfEmpty(db);
  return db;
}
