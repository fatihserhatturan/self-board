"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";

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

export async function updateCycleDuration(
  projectId: string,
  days: number,
): Promise<ActionResult<{ id: string }>> {
  if (!Number.isInteger(days) || days < 1) return { ok: false, error: "duration-invalid" };

  const db = getDb();
  const result = db
    .prepare("UPDATE projects SET cycle_duration_days = ? WHERE id = ?")
    .run(days, projectId);
  if (Number(result.changes) === 0) return { ok: false, error: "project-not-found" };

  revalidatePath("/cycles");
  return { ok: true, data: { id: projectId } };
}
