"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";
import { sanitizePreferences, type Preferences } from "@/lib/preferences-config";

/**
 * Verilen tercihleri yazar. Kısmi güncelleme: yalnızca gönderilen anahtarlara
 * dokunulur. Tercihler kök layout'tan dağıtıldığı ve başlangıç sayfası kök
 * route'un yönlendirmesini belirlediği için tüm ağaç yenileniyor.
 */
export async function updatePreferences(
  input: Partial<Preferences>,
): Promise<ActionResult<{ updated: number }>> {
  // Yalnızca bilinen anahtarlar ve geçerli değerler yazılıyor.
  const entries = Object.entries(sanitizePreferences(input));
  if (entries.length === 0) return { ok: true, data: { updated: 0 } };

  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  );

  db.exec("BEGIN");
  try {
    for (const [key, value] of entries) upsert.run(key, value);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true, data: { updated: entries.length } };
}
