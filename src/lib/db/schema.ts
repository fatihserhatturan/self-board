import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { seedIssues, seedLabels, seedPeople } from "@/lib/db/seed-data";

const DDL_SQL = `
CREATE TABLE IF NOT EXISTS teams (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  color   TEXT NOT NULL,
  initial TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS labels (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issues (
  id          TEXT PRIMARY KEY,
  team_id     TEXT NOT NULL REFERENCES teams(id),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL CHECK (status IN ('backlog','todo','in-progress','done','canceled')),
  priority    TEXT NOT NULL CHECK (priority IN ('no-priority','urgent','high','medium','low')),
  assignee_id TEXT REFERENCES users(id),
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_labels (
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id),
  PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_issues_team_status ON issues(team_id, status);
`;

export function ensureSchema(db: DatabaseSync) {
  db.exec(DDL_SQL);
}

/** Tablolar boşsa (ör. ilk çalıştırma) örnek veriyi tek transaction içinde ekler. */
export function seedIfEmpty(db: DatabaseSync) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM teams").get() as {
    count: number;
  };
  if (count > 0) return;

  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO teams (id, name, color, initial) VALUES (?, ?, ?, ?)").run(
      DEFAULT_TEAM.slug,
      DEFAULT_TEAM.name,
      DEFAULT_TEAM.color,
      DEFAULT_TEAM.initial,
    );

    const insertUser = db.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)");
    for (const person of seedPeople) insertUser.run(person.id, person.name, person.email);

    const insertLabel = db.prepare("INSERT INTO labels (id, name, color) VALUES (?, ?, ?)");
    for (const label of seedLabels) insertLabel.run(label.id, label.name, label.color);

    const insertIssue = db.prepare(
      `INSERT INTO issues (id, team_id, title, description, status, priority, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertIssueLabel = db.prepare(
      "INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)",
    );
    for (const issue of seedIssues) {
      insertIssue.run(
        issue.id,
        issue.teamId,
        issue.title,
        issue.description ?? null,
        issue.status,
        issue.priority,
        issue.assigneeId ?? null,
        issue.createdAt,
      );
      for (const labelId of issue.labelIds) insertIssueLabel.run(issue.id, labelId);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
