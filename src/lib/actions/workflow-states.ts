"use server";

import { revalidatePath } from "next/cache";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/client";
import { isValidStatusType, projectExists } from "@/lib/db/validation";
import type { ActionResult } from "@/lib/actions/issues";
import type { LabelColor } from "@/lib/actions/labels";
import type { StatusType, WorkflowState } from "@/lib/board/workflow-config";
import { FALLBACK_STATE_ICON, STATE_ICONS } from "@/lib/board/workflow-config";
import { getWorkflowStates } from "@/lib/data/workflow-states";

/** Durum değişiklikleri panoyu, listeyi, filtreleri ve cycle sayımlarını etkiliyor. */
function revalidateStateViews(): void {
  revalidatePath("/", "layout");
  revalidatePath("/settings", "layout");
}

interface StateRow {
  id: string;
  project_id: string;
  type: string;
  position: number;
}

function readState(db: DatabaseSync, id: string): StateRow | undefined {
  return db
    .prepare("SELECT id, project_id, type, position FROM workflow_states WHERE id = ?")
    .get(id) as StateRow | undefined;
}

export interface CreateStateInput {
  projectId: string;
  name: string;
  type: StatusType;
  color: LabelColor;
  icon: string;
}

export async function createWorkflowState(
  input: CreateStateInput,
): Promise<ActionResult<WorkflowState>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "name-required" };
  if (!isValidStatusType(input.type)) return { ok: false, error: "type-invalid" };

  const db = getDb();
  if (!projectExists(db, input.projectId)) return { ok: false, error: "project-not-found" };

  const { next } = db
    .prepare(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM workflow_states WHERE project_id = ?",
    )
    .get(input.projectId) as { next: number };

  const icon = STATE_ICONS[input.icon] ? input.icon : FALLBACK_STATE_ICON;
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO workflow_states (id, project_id, name, type, color, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, input.projectId, name, input.type, input.color, icon, next);

  revalidateStateViews();
  return {
    ok: true,
    data: {
      id,
      projectId: input.projectId,
      name,
      type: input.type,
      color: input.color,
      icon,
      position: next,
    },
  };
}

export async function updateWorkflowState(
  id: string,
  input: { name: string; type: StatusType; color: LabelColor; icon: string },
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "name-required" };
  if (!isValidStatusType(input.type)) return { ok: false, error: "type-invalid" };

  const db = getDb();
  const state = readState(db, id);
  if (!state) return { ok: false, error: "state-not-found" };

  // Cycle başarısı "completed" tipindeki durumlardan hesaplanıyor; son
  // tamamlanma durumunu başka bir tipe çevirmek metriği kalıcı olarak sıfırlar.
  if (state.type === "completed" && input.type !== "completed") {
    const { count } = db
      .prepare(
        "SELECT COUNT(*) AS count FROM workflow_states WHERE project_id = ? AND type = 'completed' AND id <> ?",
      )
      .get(state.project_id, id) as { count: number };
    if (count === 0) return { ok: false, error: "last-completed-state" };
  }

  const icon = STATE_ICONS[input.icon] ? input.icon : FALLBACK_STATE_ICON;
  db.prepare("UPDATE workflow_states SET name = ?, type = ?, color = ?, icon = ? WHERE id = ?").run(
    name,
    input.type,
    input.color,
    icon,
    id,
  );

  revalidateStateViews();
  return { ok: true, data: { id } };
}

/** Durumu bir sıra yukarı ya da aşağı taşır; komşusuyla pozisyon takas eder. */
export async function moveWorkflowState(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const state = readState(db, id);
  if (!state) return { ok: false, error: "state-not-found" };

  const neighbour = db
    .prepare(
      direction === "up"
        ? "SELECT id, position FROM workflow_states WHERE project_id = ? AND position < ? ORDER BY position DESC LIMIT 1"
        : "SELECT id, position FROM workflow_states WHERE project_id = ? AND position > ? ORDER BY position ASC LIMIT 1",
    )
    .get(state.project_id, state.position) as { id: string; position: number } | undefined;

  if (!neighbour) return { ok: true, data: { id } };

  const update = db.prepare("UPDATE workflow_states SET position = ? WHERE id = ?");
  db.exec("BEGIN");
  try {
    update.run(neighbour.position, id);
    update.run(state.position, neighbour.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateStateViews();
  return { ok: true, data: { id } };
}

/**
 * Durumu siler ve üzerindeki issue'ları `replacementId`'ye taşır.
 * `issues.state_id` için `ON DELETE` tanımlı değil: issue'lar taşınmadan durumu
 * silmek FK kısıtına çarpar (`deleteLabel` ile aynı desen).
 */
export async function deleteWorkflowState(
  id: string,
  replacementId: string,
): Promise<ActionResult<{ id: string }>> {
  const db = getDb();
  const state = readState(db, id);
  if (!state) return { ok: false, error: "state-not-found" };
  if (replacementId === id) return { ok: false, error: "replacement-required" };

  const replacement = readState(db, replacementId);
  if (!replacement || replacement.project_id !== state.project_id) {
    return { ok: false, error: "replacement-invalid" };
  }

  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM workflow_states WHERE project_id = ?")
    .get(state.project_id) as { count: number };
  if (count <= 1) return { ok: false, error: "cannot-delete-last-state" };

  if (state.type === "completed") {
    const { remaining } = db
      .prepare(
        "SELECT COUNT(*) AS remaining FROM workflow_states WHERE project_id = ? AND type = 'completed' AND id <> ?",
      )
      .get(state.project_id, id) as { remaining: number };
    if (remaining === 0) return { ok: false, error: "last-completed-state" };
  }

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE issues SET state_id = ? WHERE state_id = ?").run(replacementId, id);
    db.prepare("DELETE FROM workflow_states WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidateStateViews();
  return { ok: true, data: { id } };
}

/**
 * Bir projenin durumları. `(app)` layout'u durum çekmediği için kenar
 * çubuğundaki global "New Issue" dialog'u açılırken bunu kendisi istiyor —
 * `listProjectCycles` ile aynı gerekçe.
 */
export async function listProjectStates(projectId: string): Promise<WorkflowState[]> {
  if (!projectId) return [];
  return getWorkflowStates(projectId);
}
