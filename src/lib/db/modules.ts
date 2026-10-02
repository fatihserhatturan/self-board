import type { DatabaseSync } from "node:sqlite";

/**
 * Modül açık/kapalı durumunun okuma/yazma mantığı — `db` parametresi alan saf
 * fonksiyonlar (test edilebilirlik ve `getDb()` singleton'ından bağımsızlık
 * için, `lib/db/cascade.ts`/`lib/db/issue-writes.ts` ile aynı desen).
 *
 * `modules` tablosunda satırı olmayan bir id "kapalı" sayılır — yeni eklenen
 * bir modül hiçbir migration'a ihtiyaç duymadan varsayılan kapalı gelir.
 */
export function getEnabledModuleIdsDb(db: DatabaseSync): string[] {
  const rows = db.prepare("SELECT id FROM modules WHERE enabled = 1").all() as { id: string }[];
  return rows.map((row) => row.id);
}

/** Kapatmak satırı silmez, yalnızca `enabled = 0` yapar — veri kaybı olmadan geri açılabilsin diye. */
export function setModuleEnabledDb(db: DatabaseSync, id: string, enabled: boolean): void {
  db.prepare(
    `INSERT INTO modules (id, enabled) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled`,
  ).run(id, enabled ? 1 : 0);
}
