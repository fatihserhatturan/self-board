import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureSchema } from "@/lib/db/schema";

let db: DatabaseSync | null = null;

/** Lazy-açılan SQLite singleton'ı. `src/lib/data/*` ve `src/lib/actions/*` tarafından kullanılıyor. */
export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = path.join(process.cwd(), "data", "self-board.db");
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(db);
  return db;
}
