"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";
import type { Person } from "@/lib/data/issues";

/**
 * Üye değişiklikleri ayarların her sayfasını ve atama listesini taşıyan
 * uygulama layout'unu etkiliyor — bütün ağaç yenileniyor. Ayarlar artık alt
 * route'lara bölündüğü için düz `revalidatePath("/settings")` eşleşmiyor.
 */
function revalidateMemberViews(): void {
  revalidatePath("/settings", "layout");
  revalidatePath("/", "layout");
}

/** `users.email` UNIQUE; çakışmayı önceden yakalayıp gerçek hatalardan ayırıyoruz. */
function isEmailTaken(db: DatabaseSync, email: string, exceptId?: string): boolean {
  const row = exceptId
    ? db.prepare("SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1").get(email, exceptId)
    : db.prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1").get(email);
  return Boolean(row);
}

export async function updateCurrentUser(name: string, email: string): Promise<ActionResult<Person>> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (!trimmedName || !trimmedEmail) return { ok: false, error: "invalid-input" };

  const db = getDb();
  const current = db.prepare("SELECT id FROM users WHERE is_current = 1 LIMIT 1").get() as
    | { id: string }
    | undefined;
  if (!current) return { ok: false, error: "no-current-user" };

  if (isEmailTaken(db, trimmedEmail, current.id)) return { ok: false, error: "email-taken" };

  db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(
    trimmedName,
    trimmedEmail,
    current.id,
  );

  revalidateMemberViews();
  return { ok: true, data: { id: current.id, name: trimmedName, email: trimmedEmail } };
}

export async function createUser(name: string, email: string): Promise<ActionResult<Person>> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (!trimmedName || !trimmedEmail) return { ok: false, error: "invalid-input" };

  const db = getDb();
  if (isEmailTaken(db, trimmedEmail)) return { ok: false, error: "email-taken" };

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, name, email, is_current) VALUES (?, ?, ?, 0)").run(
    id,
    trimmedName,
    trimmedEmail,
  );

  revalidateMemberViews();
  return { ok: true, data: { id, name: trimmedName, email: trimmedEmail } };
}

export async function updateUser(
  id: string,
  input: { name: string; email: string },
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name || !email) return { ok: false, error: "invalid-input" };

  const db = getDb();
  if (isEmailTaken(db, email, id)) return { ok: false, error: "email-taken" };

  const result = db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, id);
  if (Number(result.changes) === 0) return { ok: false, error: "user-not-found" };

  revalidateMemberViews();
  return { ok: true, data: { id } };
}

/** "Ben" işaretini taşır — aynı anda yalnızca bir kullanıcı geçerli olabilir. */
export async function setCurrentUser(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM users WHERE id = ?").get(id);
  if (!exists) return { ok: false, error: "user-not-found" };

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE users SET is_current = 0 WHERE is_current = 1").run();
    db.prepare("UPDATE users SET is_current = 1 WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateMemberViews();
  return { ok: true, data: { id } };
}

export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();

  const user = db.prepare("SELECT is_current FROM users WHERE id = ?").get(id) as
    | { is_current: number }
    | undefined;
  if (!user) return { ok: false, error: "user-not-found" };
  if (Number(user.is_current) === 1) return { ok: false, error: "cannot-delete-current-user" };

  db.exec("BEGIN");
  try {
    // Şema `issues.assignee_id` için foreign key uygulamıyor (bkz. schema.ts);
    // yetim atama kalmasın diye önce elle boşaltılıyor — `deleteLabel` deseni.
    db.prepare("UPDATE issues SET assignee_id = NULL WHERE assignee_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateMemberViews();
  return { ok: true, data: { id } };
}
