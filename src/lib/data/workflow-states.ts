import { cache } from "react";
import type { LabelColor } from "@/lib/actions/labels";
import type { StatusType, WorkflowState } from "@/lib/board/workflow-config";
import { getDb } from "@/lib/db/client";
import { asString } from "@/lib/db/row-values";

const STATE_SELECT = `
  SELECT id, project_id, name, type, color, icon, position
  FROM workflow_states
`;

export function toWorkflowState(row: Record<string, unknown>): WorkflowState {
  return {
    id: asString(row.id),
    projectId: asString(row.project_id),
    name: asString(row.name),
    type: asString(row.type) as StatusType,
    color: asString(row.color) as LabelColor,
    icon: asString(row.icon),
    position: Number(row.position),
  };
}

/** Bir projenin durumları, pano sütun sırasıyla. */
export const getWorkflowStates = cache(async function getWorkflowStates(
  projectId: string,
): Promise<WorkflowState[]> {
  const db = getDb();
  const rows = db.prepare(`${STATE_SELECT} WHERE project_id = ? ORDER BY position ASC`).all(projectId);
  return rows.map((row) => toWorkflowState(row as Record<string, unknown>));
});

/** Tüm projelerin durumları — ayarlar sayfası hepsini tek seferde çekiyor. */
export const getAllWorkflowStates = cache(async function getAllWorkflowStates(): Promise<
  WorkflowState[]
> {
  const db = getDb();
  const rows = db.prepare(`${STATE_SELECT} ORDER BY project_id ASC, position ASC`).all();
  return rows.map((row) => toWorkflowState(row as Record<string, unknown>));
});
