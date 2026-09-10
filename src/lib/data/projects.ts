import { getDb } from "@/lib/db/client";
import type { LabelColor } from "@/lib/actions/labels";

export interface Project {
  id: string;
  name: string;
  prefix: string;
  color: LabelColor;
  hasIcon: boolean;
  cycleDurationDays: number;
  createdAt: string;
}

const PROJECT_SELECT = `
  SELECT id, name, prefix, color, cycle_duration_days, created_at, icon_data IS NOT NULL AS has_icon
  FROM projects
`;

function asString(value: unknown): string {
  return String(value);
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: asString(row.id),
    name: asString(row.name),
    prefix: asString(row.prefix),
    color: asString(row.color) as LabelColor,
    hasIcon: Boolean(row.has_icon),
    cycleDurationDays: Number(row.cycle_duration_days),
    createdAt: asString(row.created_at),
  };
}

export async function getProjects(): Promise<Project[]> {
  const db = getDb();
  const rows = db.prepare(`${PROJECT_SELECT} ORDER BY created_at ASC`).all();
  return rows.map((row) => toProject(row as Record<string, unknown>));
}

export async function getProject(id: string): Promise<Project | null> {
  const db = getDb();
  const row = db.prepare(`${PROJECT_SELECT} WHERE id = ?`).get(id);
  if (!row) return null;
  return toProject(row as Record<string, unknown>);
}

/**
 * `?project=` search param eksik veya artık var olmayan bir projeye
 * işaret ediyorsa (silinmiş proje, eski bookmark) ilk projeye düşer.
 * `projects` her zaman en az bir satır içerir (bkz. schema.ts / deleteProject).
 */
export function resolveActiveProject(projects: Project[], requestedId?: string): Project {
  const match = requestedId ? projects.find((project) => project.id === requestedId) : undefined;
  return match ?? projects[0];
}
