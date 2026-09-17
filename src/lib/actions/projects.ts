"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { deleteProjectCascade } from "@/lib/db/cascade";
import { seedProjectStates } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/actions/issues";
import type { LabelColor } from "@/lib/actions/labels";
import type { Project } from "@/lib/data/projects";

const PREFIX_PATTERN = /^[A-Z]{2,5}$/;

export interface CreateProjectInput {
  name: string;
  prefix: string;
  color: LabelColor;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<ActionResult<Project>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "name-required" };

  const prefix = input.prefix.trim().toUpperCase();
  if (!PREFIX_PATTERN.test(prefix)) return { ok: false, error: "prefix-invalid" };

  const db = getDb();
  const taken = db.prepare("SELECT 1 FROM projects WHERE prefix = ?").get(prefix);
  if (taken) return { ok: false, error: "prefix-taken" };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Durumlar proje başına; yeni proje varsayılan beş sütunla açılmalı yoksa
  // panosu boş kalır ve issue oluşturulamaz.
  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO projects (id, name, prefix, color, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, name, prefix, input.color, createdAt);
    seedProjectStates(db, id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidatePath("/projects");
  return {
    ok: true,
    data: { id, name, prefix, color: input.color, hasIcon: false, cycleDurationDays: 14, createdAt },
  };
}

const ALLOWED_ICON_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_ICON_BYTES = 5 * 1024 * 1024;

export async function updateProjectIcon(
  id: string,
  base64: string,
  mimeType: string,
): Promise<ActionResult<{ id: string }>> {
  if (!ALLOWED_ICON_MIME_TYPES.has(mimeType)) return { ok: false, error: "unsupported-type" };

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0) return { ok: false, error: "empty-file" };
  if (buffer.byteLength > MAX_ICON_BYTES) return { ok: false, error: "file-too-large" };

  const db = getDb();
  const result = db
    .prepare("UPDATE projects SET icon_mime_type = ?, icon_data = ? WHERE id = ?")
    .run(mimeType, buffer, id);
  if (Number(result.changes) === 0) return { ok: false, error: "project-not-found" };

  revalidatePath("/projects");
  return { ok: true, data: { id } };
}

export async function removeProjectIcon(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db
    .prepare("UPDATE projects SET icon_mime_type = NULL, icon_data = NULL WHERE id = ?")
    .run(id);
  if (Number(result.changes) === 0) return { ok: false, error: "project-not-found" };

  revalidatePath("/projects");
  return { ok: true, data: { id } };
}

export async function updateProject(
  id: string,
  input: { name: string; color: LabelColor },
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "name-required" };

  const db = getDb();
  const result = db
    .prepare("UPDATE projects SET name = ?, color = ? WHERE id = ?")
    .run(name, input.color, id);
  if (Number(result.changes) === 0) return { ok: false, error: "project-not-found" };

  revalidatePath("/projects");
  revalidatePath("/issues");
  revalidatePath("/views");
  return { ok: true, data: { id } };
}

export async function deleteProject(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as {
    count: number;
  };
  if (count <= 1) return { ok: false, error: "cannot-delete-last-project" };

  if (!deleteProjectCascade(db, id)) return { ok: false, error: "project-not-found" };

  revalidatePath("/projects");
  revalidatePath("/issues");
  revalidatePath("/views");
  return { ok: true, data: { id } };
}
