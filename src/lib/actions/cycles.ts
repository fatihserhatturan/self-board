"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { getCycles } from "@/lib/data/cycles";
import { isoDateFromDate, parseIsoDate, todayIsoDate } from "@/lib/board/cycle-status";
import type { Cycle } from "@/lib/data/cycles";
import type { ActionResult } from "@/lib/actions/issues";

/**
 * Bir projenin cycle'ları — `(app)` layout'u cycle çekmediği için kenar
 * çubuğundaki global "New Issue" dialog'u açılırken bunu kendisi istiyor.
 * `getCycles()` gibi rollover/snapshot yan etkilerini de çalıştırır.
 */
export async function listProjectCycles(projectId: string): Promise<Cycle[]> {
  if (!projectId) return [];
  return getCycles(projectId);
}

export async function renameCycle(id: string, name: string): Promise<ActionResult<{ id: string }>> {
  const trimmed = name.trim();
  const db = getDb();
  const result = db
    .prepare("UPDATE cycles SET name = ? WHERE id = ?")
    .run(trimmed || null, id);
  if (Number(result.changes) === 0) return { ok: false, error: "cycle-not-found" };

  revalidatePath("/cycles");
  revalidatePath("/issues");
  return { ok: true, data: { id } };
}

const MIN_CYCLE_DAYS = 7;
const MAX_CYCLE_DAYS = 56;

export async function updateCycleDuration(
  projectId: string,
  days: number,
): Promise<ActionResult<{ id: string }>> {
  if (!Number.isInteger(days) || days < MIN_CYCLE_DAYS || days > MAX_CYCLE_DAYS) {
    return { ok: false, error: "duration-invalid" };
  }

  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = db
      .prepare("UPDATE projects SET cycle_duration_days = ? WHERE id = ?")
      .run(days, projectId);
    if (Number(result.changes) === 0) {
      db.exec("ROLLBACK");
      return { ok: false, error: "project-not-found" };
    }

    // Başlamamış cycle'lar yeni süreye göre yeniden hesaplanıyor. Önceden
    // yalnızca bundan sonra oluşturulacaklar etkileniyordu; önceden üretilmiş
    // "yaklaşan" cycle eski süresiyle kalıp ayarı yok sayıyordu.
    const today = todayIsoDate();
    const upcoming = db
      .prepare("SELECT id, starts_at FROM cycles WHERE project_id = ? AND starts_at > ?")
      .all(projectId, today) as { id: string; starts_at: string }[];
    const updateEnd = db.prepare("UPDATE cycles SET ends_at = ? WHERE id = ?");
    for (const cycle of upcoming) {
      updateEnd.run(addDays(cycle.starts_at, days - 1), cycle.id);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidatePath("/cycles");
  revalidatePath("/issues");
  return { ok: true, data: { id: projectId } };
}

function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return isoDateFromDate(date);
}
