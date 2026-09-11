import { cache } from "react";
import { getDb } from "@/lib/db/client";

export interface WorkspaceStats {
  projects: number;
  issues: number;
  notes: number;
  attachments: number;
  /** Eklerin ham BLOB toplamı, bayt. */
  attachmentBytes: number;
}

/** Ayarlar > Veri sayfasındaki sayılar. Tek sorgu yeterince ucuz, ayrı ayrı okunuyor. */
export const getWorkspaceStats = cache(async function getWorkspaceStats(): Promise<WorkspaceStats> {
  const db = getDb();
  const count = (sql: string) => Number((db.prepare(sql).get() as { total: number }).total);

  return {
    projects: count("SELECT COUNT(*) AS total FROM projects"),
    issues: count("SELECT COUNT(*) AS total FROM issues"),
    notes: count("SELECT COUNT(*) AS total FROM issue_notes"),
    attachments: count("SELECT COUNT(*) AS total FROM attachments"),
    // Hiç ek yoksa SUM NULL döner.
    attachmentBytes: count("SELECT COALESCE(SUM(LENGTH(data)), 0) AS total FROM attachments"),
  };
});
