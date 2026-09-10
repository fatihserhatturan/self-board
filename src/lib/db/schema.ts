import type { DatabaseSync } from "node:sqlite";
import { seedIssues, seedLabels, seedPeople } from "@/lib/db/seed-data";

const DDL_SQL = `
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

CREATE TABLE IF NOT EXISTS projects (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  prefix              TEXT NOT NULL UNIQUE,
  color               TEXT NOT NULL,
  icon_mime_type      TEXT,
  icon_data           BLOB,
  cycle_duration_days INTEGER NOT NULL DEFAULT 14,
  created_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cycles (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL,
  name       TEXT,
  starts_at  TEXT NOT NULL,
  ends_at    TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cycle_snapshots (
  cycle_id  TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  scope     INTEGER NOT NULL,
  started   INTEGER NOT NULL,
  completed INTEGER NOT NULL,
  PRIMARY KEY (cycle_id, date)
);

CREATE TABLE IF NOT EXISTS issues (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cycle_id    TEXT REFERENCES cycles(id),
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
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  layout       TEXT NOT NULL CHECK (layout IN ('list','board')),
  filters_json TEXT NOT NULL,
  options_json TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issue_notes_issue ON issue_notes(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cycles_project ON cycles(project_id, number);
`;

const LEGACY_CURRENT_USER_EMAIL = "turan.fatih@dgpaysit.com";

export function ensureSchema(db: DatabaseSync) {
  db.exec(DDL_SQL);
  ensureTeamsRemoved(db);
  ensureProjectsAdded(db);
  ensureProjectIconColumns(db);
  ensureCyclesColumns(db);
  ensureCurrentUserColumn(db);
  ensureAttachmentIssueIdColumn(db);
}

const DEFAULT_PROJECT = {
  id: "core",
  name: "Core",
  prefix: "COR",
  color: "blue",
} as const;

/**
 * `projects` tablosu ve issues/views üzerindeki `project_id` kolonu bu sürümde
 * eklendi (tek proje varsayımından gerçek çoklu-proje desteğine geçiş). Var
 * olan DB'lerde (COR-* id'li issue/view'lar) veri kaybı olmaması için: (1)
 * `projects` tablosu boşsa geçmişteki COR-* id'lerle birebir uyumlu bir
 * varsayılan proje ekleniyor, (2) issues/views'de `project_id` kolonu eksikse
 * ekleniyor. SQLite `ALTER TABLE ADD COLUMN` ile aynı anda hem NOT NULL +
 * sabit bir DEFAULT hem de REFERENCES tanımlanmasına izin vermiyor ("Cannot
 * add a REFERENCES column with non-NULL default value") — bu yüzden migrate
 * edilen DB'lerde project_id, REFERENCES olmadan sade `TEXT NOT NULL DEFAULT
 * 'core'` olarak ekleniyor. Referential integrity zaten `PRAGMA foreign_keys`
 * hiç açılmadığı için hiçbir yerde runtime'da uygulanmıyor; deleteProject()
 * cascade'i elle yapıyor, tıpkı deleteIssue/deleteLabel gibi.
 */
function ensureProjectsAdded(db: DatabaseSync) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as {
    count: number;
  };
  if (count === 0) {
    db.prepare(
      `INSERT INTO projects (id, name, prefix, color, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      DEFAULT_PROJECT.id,
      DEFAULT_PROJECT.name,
      DEFAULT_PROJECT.prefix,
      DEFAULT_PROJECT.color,
      new Date().toISOString(),
    );
  }

  const issueColumns = db.prepare("PRAGMA table_info(issues)").all() as { name: string }[];
  if (!issueColumns.some((column) => column.name === "project_id")) {
    db.exec(
      `ALTER TABLE issues ADD COLUMN project_id TEXT NOT NULL DEFAULT '${DEFAULT_PROJECT.id}'`,
    );
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues(project_id, status)");

  const viewColumns = db.prepare("PRAGMA table_info(views)").all() as { name: string }[];
  if (!viewColumns.some((column) => column.name === "project_id")) {
    db.exec(
      `ALTER TABLE views ADD COLUMN project_id TEXT NOT NULL DEFAULT '${DEFAULT_PROJECT.id}'`,
    );
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_views_project ON views(project_id)");
}

/**
 * `icon_mime_type`/`icon_data` kolonları `projects` tablosuna sonradan
 * eklendi (renk+baş harf yerine/yanında bir resim ikonu yükleyebilmek için).
 * Var olan DB'lerde bu kolonlar eksik olacağı için ekleniyor.
 */
function ensureProjectIconColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "icon_mime_type")) {
    db.exec("ALTER TABLE projects ADD COLUMN icon_mime_type TEXT");
  }
  if (!columns.some((column) => column.name === "icon_data")) {
    db.exec("ALTER TABLE projects ADD COLUMN icon_data BLOB");
  }
}

/**
 * `projects.cycle_duration_days` ve `issues.cycle_id` bu sürümde eklendi
 * (Linear tarzı otomatik tekrarlayan cycle desteği). `cycles` tablosunun
 * kendisi hiç var olmadığı için DDL_SQL'deki `CREATE TABLE IF NOT EXISTS`
 * yeterli — sadece var olan `projects`/`issues` tablolarına yeni kolon
 * eklemek migration gerektiriyor. `cycle_id` nullable + DEFAULT'suz REFERENCES
 * olduğu için (attachments.issue_id ile aynı kombinasyon) tek adımda ekleniyor;
 * `cycle_duration_days` REFERENCES içermediği için NOT NULL+DEFAULT ile
 * sorunsuz ekleniyor (bu kısıtlama sadece REFERENCES'lı kolonlar içindi).
 */
function ensureCyclesColumns(db: DatabaseSync) {
  const projectColumns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (!projectColumns.some((column) => column.name === "cycle_duration_days")) {
    db.exec("ALTER TABLE projects ADD COLUMN cycle_duration_days INTEGER NOT NULL DEFAULT 14");
  }

  const issueColumns = db.prepare("PRAGMA table_info(issues)").all() as { name: string }[];
  if (!issueColumns.some((column) => column.name === "cycle_id")) {
    db.exec("ALTER TABLE issues ADD COLUMN cycle_id TEXT REFERENCES cycles(id)");
  }
}

/**
 * team_id kolonları issues/views tablolarından ve teams tablosunun tamamı
 * kaldırıldı (uygulama artık tek kullanıcı, tek "takım" varsayımıyla çalışıyor).
 * Eski DB dosyalarında bu kolonlar/tablo hâlâ var olabilir; PRAGMA table_info
 * ile kontrol edip varsa temizliyoruz. İlişkili index önce kaldırılmalı —
 * SQLite, bir index tarafından referans edilen kolonu DROP COLUMN ile
 * kaldırmaya izin vermiyor.
 */
function ensureTeamsRemoved(db: DatabaseSync) {
  const issueColumns = db.prepare("PRAGMA table_info(issues)").all() as { name: string }[];
  const viewColumns = db.prepare("PRAGMA table_info(views)").all() as { name: string }[];

  if (issueColumns.some((column) => column.name === "team_id")) {
    db.exec("DROP INDEX IF EXISTS idx_issues_team_status");
    db.exec("ALTER TABLE issues DROP COLUMN team_id");
  }
  if (viewColumns.some((column) => column.name === "team_id")) {
    db.exec("DROP INDEX IF EXISTS idx_views_team");
    db.exec("ALTER TABLE views DROP COLUMN team_id");
  }
  db.exec("DROP TABLE IF EXISTS teams");
  db.exec("CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status)");
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

/**
 * `issue_id` kolonu attachments tablosuna sonradan eklendi (yüklenen resimleri
 * ait oldukları issue'ya bağlayıp yetim BLOB'ları temizleyebilmek için).
 */
function ensureAttachmentIssueIdColumn(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(attachments)").all() as { name: string }[];
  const hasColumn = columns.some((column) => column.name === "issue_id");
  if (!hasColumn) {
    db.exec("ALTER TABLE attachments ADD COLUMN issue_id TEXT REFERENCES issues(id)");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_attachments_issue ON attachments(issue_id)");
}

/** Tablolar boşsa (ör. ilk çalıştırma) örnek veriyi tek transaction içinde ekler. */
export function seedIfEmpty(db: DatabaseSync) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM users").get() as {
    count: number;
  };
  if (count > 0) return;

  db.exec("BEGIN");
  try {
    const insertUser = db.prepare(
      "INSERT INTO users (id, name, email, is_current) VALUES (?, ?, ?, ?)",
    );
    for (const person of seedPeople) {
      insertUser.run(person.id, person.name, person.email, person.isCurrent ? 1 : 0);
    }

    const insertLabel = db.prepare("INSERT INTO labels (id, name, color) VALUES (?, ?, ?)");
    for (const label of seedLabels) insertLabel.run(label.id, label.name, label.color);

    const insertIssue = db.prepare(
      `INSERT INTO issues (id, project_id, title, description, status, priority, assignee_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertIssueLabel = db.prepare(
      "INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)",
    );
    for (const issue of seedIssues) {
      insertIssue.run(
        issue.id,
        DEFAULT_PROJECT.id,
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
