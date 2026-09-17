"use server";

import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";

/**
 * Tüm çalışma alanının JSON dökümü — okunabilir, başka bir araca taşınabilir
 * bir kopya. BLOB kolonları (attachment ve proje ikonu verisi) bilerek
 * dışarıda; görselleri de içeren tam kopya için `/api/backup` (SQLite dosyası).
 *
 * `workflow_states` ve `app_settings` önce eksikti: issue'lar durumlara işaret
 * ettiği için o tablo olmadan döküm tek başına anlamlı değildi.
 */
const EXPORTED_TABLES = [
  "users",
  "labels",
  "projects",
  "workflow_states",
  "cycles",
  "cycle_snapshots",
  "issues",
  "issue_labels",
  "issue_notes",
  "views",
  "app_settings",
] as const;

const COLUMN_SELECT: Partial<Record<(typeof EXPORTED_TABLES)[number], string>> = {
  projects: "id, name, prefix, color, cycle_duration_days, issue_seq, created_at",
};

export async function exportWorkspace(): Promise<ActionResult<{ json: string }>> {
  const db = getDb();

  const data: Record<string, unknown[]> = {};
  for (const table of EXPORTED_TABLES) {
    const columns = COLUMN_SELECT[table] ?? "*";
    data[table] = db.prepare(`SELECT ${columns} FROM ${table}`).all();
  }

  const payload = {
    format: "self-board-export",
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  };

  return { ok: true, data: { json: JSON.stringify(payload, null, 2) } };
}
