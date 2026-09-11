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

  // `users.email` UNIQUE — çakışmayı önceden yakalayıp gerçek hatalardan ayırıyoruz;
  // aksi halde her SQLite hatası "e-posta kullanımda" gibi raporlanıyordu.
  const taken = db
    .prepare("SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1")
    .get(trimmedEmail, current.id);
  if (taken) return { ok: false, error: "email-taken" };

  db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(
    trimmedName,
    trimmedEmail,
    current.id,
  );

  revalidatePath("/settings");
  return { ok: true, data: { id: current.id, name: trimmedName, email: trimmedEmail } };
}
