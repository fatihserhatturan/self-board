import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readUserVersion, SCHEMA_VERSION, ensureSchema } from "@/lib/db/schema";
import { createTestDb, stateIdOfType } from "@/lib/db/test-db";

function count(db: ReturnType<typeof createTestDb>, sql: string, ...params: string[]): number {
  return Number((db.prepare(sql).get(...params) as { total: number }).total);
}

describe("ensureSchema", () => {
  it("yeni veritabanını güncel sürüme işaretler", () => {
    const db = createTestDb();
    assert.equal(readUserVersion(db), SCHEMA_VERSION);
  });

  it("tekrar çalıştırıldığında idempotent", () => {
    const db = createTestDb();
    const issues = count(db, "SELECT COUNT(*) AS total FROM issues");
    ensureSchema(db);
    ensureSchema(db);
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM issues"), issues);
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM workflow_states"), 5);
  });

  it("örnek veriden sonra sayaç örnek id'lerin üstünden başlar", () => {
    const db = createTestDb();
    const { issue_seq } = db.prepare("SELECT issue_seq FROM projects WHERE id = 'core'").get() as {
      issue_seq: number;
    };
    assert.equal(issue_seq, 120);
  });
});

describe("sürüm 2 onarımı", () => {
  it("durumu kayıp issue'ları, yetim durumları, yabancı cycle'ları ve sayacı düzeltir", () => {
    const db = createTestDb();
    const backlog = stateIdOfType(db, "core", "backlog");

    // FK'siz eski bir DB'nin bırakabileceği bozuklukları kurmak için geçici olarak kapalı.
    db.exec("PRAGMA foreign_keys = OFF");
    db.prepare(
      "INSERT INTO projects (id, name, prefix, color, created_at) VALUES ('other', 'Other', 'OTH', 'grey', '2026-01-01')",
    ).run();
    db.prepare(
      "INSERT INTO workflow_states (id, project_id, name, type, color, icon, position) VALUES ('foreign-state', 'other', 'X', 'started', 'grey', 'circle', 0)",
    ).run();
    db.prepare(
      "INSERT INTO workflow_states (id, project_id, name, type, color, icon, position) VALUES ('orphan-state', 'deleted-project', 'Y', 'started', 'grey', 'circle', 0)",
    ).run();
    db.prepare(
      "INSERT INTO cycles (id, project_id, number, starts_at, ends_at, created_at) VALUES ('other-cycle', 'other', 1, '2026-01-01', '2026-01-14', '2026-01-01')",
    ).run();

    const insertIssue = db.prepare(
      "INSERT INTO issues (id, project_id, cycle_id, title, state_id, priority, created_at) VALUES (?, 'core', ?, 't', ?, 'low', '2026-01-01')",
    );
    insertIssue.run("COR-500", null, "");
    insertIssue.run("COR-501", null, null);
    insertIssue.run("COR-502", "other-cycle", "foreign-state");
    db.prepare("UPDATE projects SET issue_seq = 3 WHERE id = 'core'").run();
    db.exec("PRAGMA foreign_keys = ON");

    db.exec("PRAGMA user_version = 1");
    ensureSchema(db);

    const states = db
      .prepare("SELECT id, state_id, cycle_id FROM issues WHERE id IN ('COR-500','COR-501','COR-502') ORDER BY id")
      .all() as { id: string; state_id: string; cycle_id: string | null }[];
    for (const row of states) {
      assert.equal(row.state_id, backlog, `${row.id} backlog'a atanmalı`);
      assert.equal(row.cycle_id, null);
    }

    assert.equal(count(db, "SELECT COUNT(*) AS total FROM workflow_states WHERE id = 'orphan-state'"), 0);
    // Başka bir projenin kendi durumu silinmemeli.
    assert.equal(count(db, "SELECT COUNT(*) AS total FROM workflow_states WHERE id = 'foreign-state'"), 1);

    const { issue_seq } = db.prepare("SELECT issue_seq FROM projects WHERE id = 'core'").get() as {
      issue_seq: number;
    };
    assert.equal(issue_seq, 502);
    assert.equal(readUserVersion(db), SCHEMA_VERSION);
  });

  it("durumu olmayan bir projeye varsayılan durumları basar", () => {
    const db = createTestDb();
    db.prepare(
      "INSERT INTO projects (id, name, prefix, color, created_at) VALUES ('bare', 'Bare', 'BAR', 'grey', '2026-01-01')",
    ).run();
    db.exec("PRAGMA user_version = 1");
    ensureSchema(db);
    assert.equal(
      count(db, "SELECT COUNT(*) AS total FROM workflow_states WHERE project_id = ?", "bare"),
      5,
    );
  });
});
