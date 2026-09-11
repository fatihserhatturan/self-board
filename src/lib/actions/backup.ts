"use server";

import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";

/**
 * Tüm çalışma alanının JSON dökümü. Veri tek bir SQLite dosyasında duruyor ve
 * arayüzden hiçbir şekilde dışarı alınamıyordu — tek kişilik bir araçta bu,
 * kullanıcının verisini uygulamaya kilitliyor.
 *
 * BLOB kolonları (attachment ve proje ikonu verisi) bilerek dışarıda: döküm
 * okunabilir ve makul boyutta kalsın diye yalnızca üst veri alınıyor.
 */
const EXPORTED_TABLES = [
  "users",
  "labels",
  "projects",
  "cycles",
  "cycle_snapshots",
  "issues",
  "issue_labels",
  "issue_notes",
  "views",
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
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  return { ok: true, data: { json: JSON.stringify(payload, null, 2) } };
}
