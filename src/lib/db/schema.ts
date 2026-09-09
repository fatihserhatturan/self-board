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
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  is_current INTEGER NOT NULL DEFAULT 0
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

CREATE TABLE IF NOT EXISTS issue_notes (
  id         TEXT PRIMARY KEY,
  issue_id   TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attachments (
  id         TEXT PRIMARY KEY,
  mime_type  TEXT NOT NULL,
  data       BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS link_previews (
  url         TEXT PRIMARY KEY,
  title       TEXT,
  description TEXT,
  image       TEXT,
  favicon     TEXT,
  fetched_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS views (
  id           TEXT PRIMARY KEY,
  team_id      TEXT NOT NULL REFERENCES teams(id),
  name         TEXT NOT NULL,
  layout       TEXT NOT NULL CHECK (layout IN ('list','board')),
  filters_json TEXT NOT NULL,
  options_json TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_team_status ON issues(team_id, status);
CREATE INDEX IF NOT EXISTS idx_issue_notes_issue ON issue_notes(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_views_team ON views(team_id);
`;

const LEGACY_CURRENT_USER_EMAIL = "turan.fatih@dgpaysit.com";

export function ensureSchema(db: DatabaseSync) {
  db.exec(DDL_SQL);
  ensureCurrentUserColumn(db);
}

/**
 * `is_current` kolonu bu tabloya sonradan eklendi. `CREATE TABLE IF NOT EXISTS`
 * var olan tabloları değiştirmediği için, önceki sürümlerden gelen DB dosyalarında
 * kolonu ekleyip eski sabit CURRENT_USER e-postasıyla eşleşen satırı "ben" olarak
 * işaretliyoruz — kullanıcı elle bir şey yapmadan sürekliliği korur.
 */
function ensureCurrentUserColumn(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const hasColumn = columns.some((column) => column.name === "is_current");
  if (!hasColumn) {
    db.exec("ALTER TABLE users ADD COLUMN is_current INTEGER NOT NULL DEFAULT 0");
  }

  db.prepare(
    `UPDATE users SET is_current = 1
     WHERE email = ? AND NOT EXISTS (SELECT 1 FROM users WHERE is_current = 1)`,
  ).run(LEGACY_CURRENT_USER_EMAIL);
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

    const insertUser = db.prepare(
      "INSERT INTO users (id, name, email, is_current) VALUES (?, ?, ?, ?)",
    );
    for (const person of seedPeople) {
      insertUser.run(person.id, person.name, person.email, person.isCurrent ? 1 : 0);
    }

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
