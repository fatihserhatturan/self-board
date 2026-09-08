"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";
import type { Person } from "@/lib/data/issues";

export async function updateCurrentUser(name: string, email: string): Promise<ActionResult<Person>> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (!trimmedName || !trimmedEmail) return { ok: false, error: "invalid-input" };

  const db = getDb();
  const current = db.prepare("SELECT id FROM users WHERE is_current = 1 LIMIT 1").get() as
    | { id: string }
    | undefined;
  if (!current) return { ok: false, error: "no-current-user" };

  try {
    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(
      trimmedName,
      trimmedEmail,
      current.id,
    );
  } catch {
    return { ok: false, error: "email-taken" };
  }

  revalidatePath("/settings");
  return { ok: true, data: { id: current.id, name: trimmedName, email: trimmedEmail } };
}
