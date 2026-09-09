import { getDb } from "@/lib/db/client";
import {
  DEFAULT_VIEW_OPTIONS,
  EMPTY_FILTER_CRITERIA,
  type IssueFilterCriteria,
  type IssueViewOptions,
} from "@/lib/board/issue-view-config";
import type { TopBarView } from "@/components/app-shell/top-bar";

export interface SavedView {
  id: string;
  teamId: string;
  name: string;
  layout: TopBarView;
  filters: IssueFilterCriteria;
  options: IssueViewOptions;
  createdAt: string;
}

interface ViewRow {
  id: string;
  teamId: string;
  name: string;
  layout: TopBarView;
  filtersJson: string;
  optionsJson: string;
  createdAt: string;
}

function asString(value: unknown): string {
  return String(value);
}

function toViewRow(row: Record<string, unknown>): ViewRow {
  return {
    id: asString(row.id),
    teamId: asString(row.team_id),
    name: asString(row.name),
    layout: asString(row.layout) as TopBarView,
    filtersJson: asString(row.filters_json),
    optionsJson: asString(row.options_json),
    createdAt: asString(row.created_at),
  };
}

/** Bozuk/eksik bir JSON kaydı sayfayı çökertmesin diye varsayılana düşülüyor — localStorage okumasındaki desenle aynı. */
function parseFilters(raw: string): IssueFilterCriteria {
  try {
    return { ...EMPTY_FILTER_CRITERIA, ...JSON.parse(raw) };
  } catch {
    return EMPTY_FILTER_CRITERIA;
  }
}

function parseOptions(raw: string): IssueViewOptions {
  try {
    return { ...DEFAULT_VIEW_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VIEW_OPTIONS;
  }
}

function toSavedView(row: ViewRow): SavedView {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    layout: row.layout,
    filters: parseFilters(row.filtersJson),
    options: parseOptions(row.optionsJson),
    createdAt: row.createdAt,
  };
}

export async function getViews(teamId: string): Promise<SavedView[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, team_id, name, layout, filters_json, options_json, created_at
       FROM views WHERE team_id = ? ORDER BY created_at ASC`,
    )
    .all(teamId);
  return rows.map((row) => toSavedView(toViewRow(row as Record<string, unknown>)));
}

export async function getView(id: string): Promise<SavedView | null> {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, team_id, name, layout, filters_json, options_json, created_at
       FROM views WHERE id = ?`,
    )
    .get(id);
  if (!row) return null;
  return toSavedView(toViewRow(row as Record<string, unknown>));
}
