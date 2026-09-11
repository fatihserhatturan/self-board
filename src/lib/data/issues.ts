import { cache } from "react";
import type { BadgeProps } from "@/components/ui/badge";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";
import { getDb } from "@/lib/db/client";
import { asString, asNullableString } from "@/lib/db/row-values";

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface IssueLabel {
  id: string;
  name: string;
  color: NonNullable<BadgeProps["color"]>;
}

export interface BoardIssue {
  id: string;
  projectId: string;
  cycleId: string | null;
  title: string;
  description?: string;
  status: StatusState;
  priority: PriorityLevel;
  assignee?: Person;
  labels: IssueLabel[];
  createdAt: string;
}

interface IssueRow {
  id: string;
  projectId: string;
  cycleId: string | null;
  title: string;
  description: string | null;
  status: StatusState;
  priority: PriorityLevel;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  createdAt: string;
}

interface IssueLabelRow {
  issueId: string;
  labelId: string;
  labelName: string;
  labelColor: IssueLabel["color"];
}



function toIssueRow(row: Record<string, unknown>): IssueRow {
  return {
    id: asString(row.id),
    projectId: asString(row.project_id),
    cycleId: asNullableString(row.cycle_id),
    title: asString(row.title),
    description: asNullableString(row.description),
    status: asString(row.status) as StatusState,
    priority: asString(row.priority) as PriorityLevel,
    assigneeId: asNullableString(row.assignee_id),
    assigneeName: asNullableString(row.assignee_name),
    assigneeEmail: asNullableString(row.assignee_email),
    createdAt: asString(row.created_at),
  };
}

function toIssueLabelRow(row: Record<string, unknown>): IssueLabelRow {
  return {
    issueId: asString(row.issue_id),
    labelId: asString(row.label_id),
    labelName: asString(row.label_name),
    labelColor: asString(row.label_color) as IssueLabel["color"],
  };
}

/**
 * Hydrate edilmiş issue'lar. `projectId` verilmezse tümü (projeler-arası,
 * ör. My Issues) döner. SQLite'a iki sorgu atıp label'ları JS'te Map ile
 * manuel join ediyor. `async` kalıyor (DatabaseSync sync olsa da) — arayüz
 * stabil, ileride farklı bir backend'e geçilirse çağıran taraflar etkilenmez.
 *
 * `cache()` ile sarılı: `(app)` layout'u ve sayfanın kendisi aynı istekte aynı
 * sorguları çalıştırıyordu, artık ikincisi ilk sonucu paylaşıyor.
 */
export const getIssues = cache(async function getIssues(
  projectId?: string,
  cycleId?: string,
): Promise<BoardIssue[]> {
  const db = getDb();

  const conditions: string[] = [];
  const params: string[] = [];
  if (projectId) {
    conditions.push("i.project_id = ?");
    params.push(projectId);
  }
  if (cycleId) {
    conditions.push("i.cycle_id = ?");
    params.push(cycleId);
  }

  const issuesSql = `
    SELECT i.id, i.project_id, i.cycle_id, i.title, i.description, i.status, i.priority,
           i.assignee_id, u.name AS assignee_name, u.email AS assignee_email,
           i.created_at
    FROM issues i
    LEFT JOIN users u ON u.id = i.assignee_id
    ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY i.created_at ASC
  `;
  const rawIssueRows = db.prepare(issuesSql).all(...params);
  const issueRows = rawIssueRows.map(toIssueRow);

  // Label satırları da aynı issue kümesiyle sınırlanıyor; önceden proje filtresi
  // verilse bile `issue_labels` tablosunun tamamı okunuyordu.
  const issueIds = issueRows.map((row) => row.id);
  const labelRows =
    issueIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT il.issue_id, l.id AS label_id, l.name AS label_name, l.color AS label_color
             FROM issue_labels il
             JOIN labels l ON l.id = il.label_id
             WHERE il.issue_id IN (${issueIds.map(() => "?").join(",")})`,
          )
          .all(...issueIds)
          .map(toIssueLabelRow);

  const labelsByIssueId = new Map<string, IssueLabel[]>();
  for (const row of labelRows) {
    const list = labelsByIssueId.get(row.issueId) ?? [];
    list.push({ id: row.labelId, name: row.labelName, color: row.labelColor });
    labelsByIssueId.set(row.issueId, list);
  }

  return issueRows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    cycleId: row.cycleId,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    assignee:
      row.assigneeId && row.assigneeName && row.assigneeEmail
        ? { id: row.assigneeId, name: row.assigneeName, email: row.assigneeEmail }
        : undefined,
    labels: labelsByIssueId.get(row.id) ?? [],
    createdAt: row.createdAt,
  }));
});

export const getUsers = cache(async function getUsers(): Promise<Person[]> {
  const db = getDb();
  const rows = db.prepare("SELECT id, name, email FROM users ORDER BY name ASC").all();
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return { id: asString(r.id), name: asString(r.name), email: asString(r.email) };
  });
});

export const getCurrentUser = cache(async function getCurrentUser(): Promise<Person | null> {
  const db = getDb();
  const row = db.prepare("SELECT id, name, email FROM users WHERE is_current = 1 LIMIT 1").get();
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return { id: asString(r.id), name: asString(r.name), email: asString(r.email) };
});

export const getLabels = cache(async function getLabels(): Promise<IssueLabel[]> {
  const db = getDb();
  const rows = db.prepare("SELECT id, name, color FROM labels ORDER BY name ASC").all();
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return { id: asString(r.id), name: asString(r.name), color: asString(r.color) as IssueLabel["color"] };
  });
});
