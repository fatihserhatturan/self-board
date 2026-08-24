import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureSchema } from "@/lib/db/schema";

let db: DatabaseSync | null = null;

/**
 * Lazy-açılan SQLite singleton'ı. UI bu fazda bu modülü hiç import etmiyor —
 * yalnızca `scripts/seed.ts` tarafından çağrılıyor. İleride gerçek okuma/yazma
 * gerektiğinde `src/lib/data/*` katmanları bu client'a bağlanacak.
 */
export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = path.join(process.cwd(), "data", "self-board.db");
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(db);
  return db;
}
