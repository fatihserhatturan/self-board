import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureSchema, seedIfEmpty } from "@/lib/db/schema";

let db: DatabaseSync | null = null;

/** Lazy-açılan SQLite singleton'ı. `src/lib/data/*` ve `src/lib/actions/*` tarafından kullanılıyor. */
export function getDb(): DatabaseSync {
  if (db) return db;
  // Paketlenmiş Electron uygulaması bu değişkeni userData dizinine ayarlar; aksi halde bugünkü davranış korunur.
  const dbDir = process.env.SELF_BOARD_DB_DIR ?? path.join(process.cwd(), "data");
  const dbPath = path.join(dbDir, "self-board.db");
  mkdirSync(dbDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(db);
  seedIfEmpty(db);
  return db;
}
