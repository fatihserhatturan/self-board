"use server";

import { revalidatePath } from "next/cache";
import type { BadgeProps } from "@/components/ui/badge";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";
import type { IssueLabel } from "@/lib/data/issues";

export type LabelColor = NonNullable<BadgeProps["color"]>;

export async function createLabel(
  name: string,
  color: LabelColor,
): Promise<ActionResult<IssueLabel>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "name-required" };

  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO labels (id, name, color) VALUES (?, ?, ?)").run(id, trimmed, color);

  revalidatePath("/settings");
  return { ok: true, data: { id, name: trimmed, color } };
}

export async function updateLabel(
  id: string,
  input: { name: string; color: LabelColor },
): Promise<ActionResult<{ id: string }>> {
  const trimmed = input.name.trim();
  if (!trimmed) return { ok: false, error: "name-required" };

  const db = getDb();
  const result = db
    .prepare("UPDATE labels SET name = ?, color = ? WHERE id = ?")
    .run(trimmed, input.color, id);

  if (Number(result.changes) === 0) return { ok: false, error: "label-not-found" };

  revalidatePath("/settings");
  return { ok: true, data: { id } };
}

export async function deleteLabel(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  // Şema `issue_labels.label_id` için CASCADE tanımlamıyor ve proje foreign key
  // enforcement'ı açmıyor — orphan satır kalmasın diye önce join tablosunu temizliyoruz.
  db.prepare("DELETE FROM issue_labels WHERE label_id = ?").run(id);
  const result = db.prepare("DELETE FROM labels WHERE id = ?").run(id);

  if (Number(result.changes) === 0) return { ok: false, error: "label-not-found" };

  revalidatePath("/settings");
  return { ok: true, data: { id } };
}
