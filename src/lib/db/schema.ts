import type { DatabaseSync } from "node:sqlite";
import { seedIssues, seedLabels, seedPeople } from "@/lib/db/seed-data";
import { DEFAULT_STATES } from "@/lib/board/workflow-config";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

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
  issue_seq           INTEGER NOT NULL DEFAULT 0,
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

-- Board sütunları. Kullanıcı proje başına istediği kadar durum tanımlıyor; her
-- biri beş sabit sistem tipinden birine bağlı (bkz. lib/board/workflow-config.ts).
-- Cycle metrikleri durumun adına değil tipine bakıyor.
CREATE TABLE IF NOT EXISTS workflow_states (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('backlog','unstarted','started','completed','canceled')),
  color      TEXT NOT NULL,
  icon       TEXT NOT NULL,
  position   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS issues (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cycle_id    TEXT REFERENCES cycles(id),
  title       TEXT NOT NULL,
  description TEXT,
  state_id    TEXT REFERENCES workflow_states(id),
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

-- Uygulama tercihleri. Anahtar-değer çünkü her yeni tercih için migration
-- yazmak istemiyoruz; tipler ve varsayılanlar lib/data/preferences.ts içinde.
-- Sunucunun okuması gereken tercihler burada tutuluyor (ör. başlangıç sayfası,
-- kök route'un yönlendirmesini belirliyor); tema ve dil ilk boyamadan önce
-- gerektiği için localStorage'da kalıyor.
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Opsiyonel modüllerin (bkz. lib/modules/registry.ts) açık/kapalı durumu.
-- Satırı olmayan bir id kapalı sayılır — modüller varsayılan hep kapalı gelir.
CREATE TABLE IF NOT EXISTS modules (
  id      TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_issue_notes_issue ON issue_notes(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cycles_project ON cycles(project_id, number);
CREATE INDEX IF NOT EXISTS idx_states_project ON workflow_states(project_id, position);
`;

/**
 * Her modülün kendi tablo(lar)ının DDL'i (varsa) ana `DDL_SQL`'e eklenir.
 * Modül kapalıyken de tablo her zaman kurulur (bkz. registry.ts'teki gerekçe)
 * — bu yüzden `SCHEMA_VERSION` artırmaya ya da versiyonlu bir migration'a
 * gerek yok, `CREATE TABLE IF NOT EXISTS` zaten idempotent.
 */
const MODULE_DDL_SQL = MODULE_REGISTRY.map((module) => module.ddl ?? "").join("\n");


/**
 * Şema sürümü `PRAGMA user_version`'da tutuluyor. Sürüm 1, `ensure*`
 * fonksiyonlarının kolon kontrolüyle yaptığı eski (sürümsüz) migration'ların
 * tamamı — onlar idempotent olduğu için her açılışta çalışmaya devam ediyor.
 * Bundan sonraki migration'lar `if (version < N)` bloklarıyla eklenir.
 */
export const SCHEMA_VERSION = 2;

export function ensureSchema(db: DatabaseSync) {
  // Tamamı tek transaction: SQLite'ta DDL de transaction'a dahil, yarıda kalan
  // bir migration DB'yi karışık bir şemayla bırakmıyor. IMMEDIATE, aynı dosyayı
  // açmış ikinci bir süreçle yazma yarışını baştan engelliyor.
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(DDL_SQL + MODULE_DDL_SQL);
    ensureTeamsRemoved(db);
    ensureProjectsAdded(db);
    ensureProjectIconColumns(db);
    ensureCyclesColumns(db);
    ensureCurrentUserColumn(db);
    ensureAttachmentIssueIdColumn(db);
    ensureProjectIssueSeq(db);
    ensureWorkflowStates(db);

    const version = readUserVersion(db);
    if (version < 2) repairIssueIntegrity(db);
    if (version < SCHEMA_VERSION) db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function readUserVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  return Number(row.user_version);
}

/** Bir projedeki issue id'lerinin (`PRE-123`) en büyük sayısal soneki. */
function maxIssueNumber(db: DatabaseSync, projectId: string): number {
  const rows = db.prepare("SELECT id FROM issues WHERE project_id = ?").all(projectId) as {
    id: string;
  }[];
  return rows.reduce((highest, row) => {
    const match = /-(\d+)$/.exec(row.id);
    const value = match ? Number(match[1]) : 0;
    return value > highest ? value : highest;
  }, 0);
}

/**
 * Sürüm 2 — veri onarımı. `node:sqlite` foreign key'leri varsayılan olarak
 * zorluyor, ama FK'ler ALTER ile eklenen kolonlarda eksik olabiliyor ve bu
 * kısıtlar yalnızca var olmayan satırı yakalıyor, "başka projenin satırı"nı
 * değil. Önceki sürümlerde doğrulanmayan girdiler şunları bırakabiliyordu:
 * - Başka projeye ait ya da NULL `state_id` (INNER JOIN yüzünden görünmez issue).
 * - Başka projeye ait `cycle_id`.
 * - Projesi olmayan `workflow_states` (FK'siz eski DB'lerde).
 * - Örnek veri COR-101…120 id'lerini kullanırken `issue_seq` 0'da kalıyordu;
 *   101. issue birincil anahtar çakışmasıyla oluşturulamazdı.
 */
function repairIssueIntegrity(db: DatabaseSync) {
  const projects = db.prepare("SELECT id, issue_seq FROM projects").all() as {
    id: string;
    issue_seq: number;
  }[];

  const countStates = db.prepare("SELECT COUNT(*) AS count FROM workflow_states WHERE project_id = ?");
  const fallbackState = db.prepare(
    `SELECT id FROM workflow_states WHERE project_id = ?
     ORDER BY CASE WHEN type = 'backlog' THEN 0 ELSE 1 END, position ASC
     LIMIT 1`,
  );
  const reassignStates = db.prepare(
    `UPDATE issues SET state_id = ?
     WHERE project_id = ?
       AND (state_id IS NULL OR state_id NOT IN (SELECT id FROM workflow_states WHERE project_id = ?))`,
  );
  const clearForeignCycles = db.prepare(
    `UPDATE issues SET cycle_id = NULL
     WHERE project_id = ?
       AND cycle_id IS NOT NULL
       AND cycle_id NOT IN (SELECT id FROM cycles WHERE project_id = ?)`,
  );
  const updateSeq = db.prepare("UPDATE projects SET issue_seq = ? WHERE id = ?");

  for (const project of projects) {
    const { count } = countStates.get(project.id) as { count: number };
    if (Number(count) === 0) seedProjectStates(db, project.id);

    const fallback = fallbackState.get(project.id) as { id: string };
    reassignStates.run(fallback.id, project.id, project.id);
    clearForeignCycles.run(project.id, project.id);

    const max = maxIssueNumber(db, project.id);
    if (max > Number(project.issue_seq)) updateSeq.run(max, project.id);
  }

  // Issue'lar yeniden atandıktan SONRA: hâlâ bir issue'nun işaret ettiği durum
  // silinirse FK kısıtı migration'ı — dolayısıyla uygulamanın açılışını — kırar.
  db.exec(
    `DELETE FROM workflow_states
     WHERE project_id NOT IN (SELECT id FROM projects)
       AND id NOT IN (SELECT state_id FROM issues WHERE state_id IS NOT NULL)`,
  );
}

/** Bir projeye varsayılan durumları basar ve `legacyStatus -> id` eşlemesini döner. */
export function seedProjectStates(db: DatabaseSync, projectId: string): Map<string, string> {
  const insert = db.prepare(
    "INSERT INTO workflow_states (id, project_id, name, type, color, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const mapping = new Map<string, string>();
  DEFAULT_STATES.forEach((state, index) => {
    const id = crypto.randomUUID();
    insert.run(id, projectId, state.name, state.type, state.color, state.icon, index);
    mapping.set(state.legacyStatus, id);
  });
  return mapping;
}

/**
 * Durumlar bu sürümde sabit bir birleşim tipinden `workflow_states` satırlarına
 * taşındı. Var olan DB'lerde: (1) her projeye bugünküyle birebir aynı beş
 * varsayılan durum eklenir, (2) `issues.state_id` kolonu açılıp eski `status`
 * literali karşılık gelen durum id'siyle doldurulur, (3) kaydedilmiş
 * görünümlerin `filters.statuses` dizisi aynı eşlemeyle `stateIds`'e çevrilir —
 * aksi halde o filtreler hiçbir issue eşleştirmezdi.
 *
 * Eski `status` kolonu bilerek DROP edilmiyor: `CHECK` kısıtlı bir kolonu
 * düşürmek SQLite'ta tabloyu yeniden yazmayı gerektiriyor ve geri dönüş yolunu
 * kapatıyor. Kolon artık ne okunuyor ne yazılıyor.
 */
function ensureWorkflowStates(db: DatabaseSync) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM workflow_states").get() as {
    count: number;
  };

  const projects = db.prepare("SELECT id FROM projects").all() as { id: string }[];
  const mappingByProject = new Map<string, Map<string, string>>();

  if (count === 0) {
    for (const project of projects) {
      mappingByProject.set(project.id, seedProjectStates(db, project.id));
    }
  }

  const issueColumns = db.prepare("PRAGMA table_info(issues)").all() as { name: string }[];
  const hasStateId = issueColumns.some((column) => column.name === "state_id");
  const hasLegacyStatus = issueColumns.some((column) => column.name === "status");

  if (!hasStateId) {
    db.exec("ALTER TABLE issues ADD COLUMN state_id TEXT REFERENCES workflow_states(id)");

    if (hasLegacyStatus) {
      const update = db.prepare(
        "UPDATE issues SET state_id = ? WHERE project_id = ? AND status = ?",
      );
      for (const project of projects) {
        const mapping = mappingByProject.get(project.id) ?? readStateMapping(db, project.id);
        for (const [legacyStatus, stateId] of mapping) {
          update.run(stateId, project.id, legacyStatus);
        }
      }
      migrateViewFilters(db, mappingByProject, projects);
    }
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state_id)");
}

/** Zaten var olan durumlardan `legacyStatus -> id` eşlemesini ada göre kurar. */
function readStateMapping(db: DatabaseSync, projectId: string): Map<string, string> {
  const rows = db
    .prepare("SELECT id, name FROM workflow_states WHERE project_id = ?")
    .all(projectId) as { id: string; name: string }[];

  const byName = new Map(rows.map((row) => [row.name, row.id]));
  const mapping = new Map<string, string>();
  for (const state of DEFAULT_STATES) {
    const id = byName.get(state.name);
    if (id) mapping.set(state.legacyStatus, id);
  }
  return mapping;
}

/** Kaydedilmiş görünümlerdeki `statuses` dizisini `stateIds`'e çevirir. */
function migrateViewFilters(
  db: DatabaseSync,
  mappingByProject: Map<string, Map<string, string>>,
  projects: { id: string }[],
): void {
  const views = db.prepare("SELECT id, project_id, filters_json FROM views").all() as {
    id: string;
    project_id: string;
    filters_json: string;
  }[];
  if (views.length === 0) return;

  for (const project of projects) {
    if (!mappingByProject.has(project.id)) {
      mappingByProject.set(project.id, readStateMapping(db, project.id));
    }
  }

  const update = db.prepare("UPDATE views SET filters_json = ? WHERE id = ?");
  for (const view of views) {
    let filters: Record<string, unknown>;
    try {
      filters = JSON.parse(view.filters_json) as Record<string, unknown>;
    } catch {
      continue;
    }

    const legacy = filters.statuses;
    if (!Array.isArray(legacy)) continue;

    const mapping = mappingByProject.get(view.project_id);
    filters.stateIds = mapping
      ? legacy.map((status) => mapping.get(String(status))).filter(Boolean)
      : [];
    delete filters.statuses;
    update.run(JSON.stringify(filters), view.id);
  }
}

/**
 * `projects.issue_seq` bu sürümde eklendi. Önceden yeni issue id'si "projedeki
 * en yüksek numara + 1" ile üretiliyordu; son issue silinince aynı id yeniden
 * dağıtılıyor ve notlarda geçen eski referanslar başka bir issue'ya işaret
 * ediyordu. Sayaç artık monoton — var olan DB'lerde mevcut en yüksek numaradan
 * başlatılıyor ki geçiş anında çakışma olmasın.
 */
function ensureProjectIssueSeq(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (columns.some((column) => column.name === "issue_seq")) return;

  db.exec("ALTER TABLE projects ADD COLUMN issue_seq INTEGER NOT NULL DEFAULT 0");

  const projects = db.prepare("SELECT id FROM projects").all() as { id: string }[];
  const updateSeq = db.prepare("UPDATE projects SET issue_seq = ? WHERE id = ?");
  for (const project of projects) {
    updateSeq.run(maxIssueNumber(db, project.id), project.id);
  }
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
 * 'core'` olarak ekleniyor. Bu kolonda FK kısıtı olmadığı için proje silme
 * temizliği `lib/db/cascade.ts` içinde açıkça yapılıyor.
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
  db.exec("CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id)");

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
}

/**
 * `is_current` kolonu bu tabloya sonradan eklendi. `CREATE TABLE IF NOT EXISTS`
 * var olan tabloları değiştirmediği için önceki sürümlerden gelen DB dosyalarında
 * kolon ekleniyor. Hiçbir satır "ben" değilse ilk kullanıcı işaretleniyor:
 * `getCurrentUser()` null dönerse My Issues boş kalır ve profil sayfası
 * düzenlenecek bir kayıt bulamaz.
 */
function ensureCurrentUserColumn(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const hasColumn = columns.some((column) => column.name === "is_current");
  if (!hasColumn) {
    db.exec("ALTER TABLE users ADD COLUMN is_current INTEGER NOT NULL DEFAULT 0");
  }

  db.exec(
    `UPDATE users SET is_current = 1
     WHERE id = (SELECT id FROM users ORDER BY rowid LIMIT 1)
       AND NOT EXISTS (SELECT 1 FROM users WHERE is_current = 1)`,
  );
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

    // Örnek issue'lar eski durum anahtarlarıyla tanımlı; `ensureWorkflowStates`
    // varsayılan durumları zaten basmış olduğu için eşlemeyi oradan okuyoruz.
    const stateIds = readStateMapping(db, DEFAULT_PROJECT.id);

    const insertIssue = db.prepare(
      `INSERT INTO issues (id, project_id, title, description, state_id, priority, assignee_id, created_at)
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
        stateIds.get(issue.status) ?? null,
        issue.priority,
        issue.assigneeId ?? null,
        issue.createdAt,
      );
      for (const labelId of issue.labelIds) insertIssueLabel.run(issue.id, labelId);
    }

    // Sayaç örnek id'lerin üstünden başlamalı; aksi halde yeni issue'lar
    // COR-1'den sayıp COR-101'de örnek veriyle çakışırdı.
    db.prepare("UPDATE projects SET issue_seq = ? WHERE id = ?").run(
      maxIssueNumber(db, DEFAULT_PROJECT.id),
      DEFAULT_PROJECT.id,
    );

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
