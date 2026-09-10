"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";
import type { SavedView } from "@/lib/data/views";
import type { IssueFilterCriteria } from "@/components/board/issue-filter-panel";
import type { IssueViewOptions } from "@/components/board/issue-view-options-panel";
import type { TopBarView } from "@/components/app-shell/top-bar";

export interface CreateViewInput {
  projectId: string;
  name: string;
  layout: TopBarView;
  filters: IssueFilterCriteria;
  options: IssueViewOptions;
}

export async function createView(input: CreateViewInput): Promise<ActionResult<SavedView>> {
  const trimmed = input.name.trim();
  if (!trimmed) return { ok: false, error: "name-required" };

  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO views (id, project_id, name, layout, filters_json, options_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.projectId,
    trimmed,
    input.layout,
    JSON.stringify(input.filters),
    JSON.stringify(input.options),
    createdAt,
  );

  revalidatePath("/views");
  return {
    ok: true,
    data: {
      id,
      projectId: input.projectId,
      name: trimmed,
      layout: input.layout,
      filters: input.filters,
      options: input.options,
      createdAt,
    },
  };
}

export async function updateView(
  id: string,
  input: CreateViewInput,
): Promise<ActionResult<{ id: string }>> {
  const trimmed = input.name.trim();
  if (!trimmed) return { ok: false, error: "name-required" };

  const db = getDb();
  const result = db
    .prepare(
      `UPDATE views SET name = ?, layout = ?, filters_json = ?, options_json = ? WHERE id = ?`,
    )
    .run(trimmed, input.layout, JSON.stringify(input.filters), JSON.stringify(input.options), id);
  if (Number(result.changes) === 0) return { ok: false, error: "view-not-found" };

  revalidatePath("/views");
  return { ok: true, data: { id } };
}

export async function renameView(
  id: string,
  name: string,
): Promise<ActionResult<{ id: string }>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "name-required" };

  const db = getDb();
  const result = db.prepare("UPDATE views SET name = ? WHERE id = ?").run(trimmed, id);
  if (Number(result.changes) === 0) return { ok: false, error: "view-not-found" };

  revalidatePath("/views");
  return { ok: true, data: { id } };
}

export async function deleteView(id: string): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const result = db.prepare("DELETE FROM views WHERE id = ?").run(id);
  if (Number(result.changes) === 0) return { ok: false, error: "view-not-found" };

  revalidatePath("/views");
  return { ok: true, data: { id } };
}
