import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, describe, it } from "node:test";
import { restoreFromFile } from "@/lib/db/restore";
import { setModuleEnabledDb } from "@/lib/db/modules";
import { createTestDb, stateIdOfType, withFakeAttachmentModule } from "@/lib/db/test-db";

const workDir = mkdtempSync(path.join(tmpdir(), "self-board-restore-"));
after(() => rmSync(workDir, { recursive: true, force: true }));

/** Bellekteki bir veritabanından dosya yedeği üretir (route'daki `VACUUM INTO` ile aynı yol). */
function writeBackup(db: DatabaseSync, name: string): string {
  const target = path.join(workDir, name);
  db.prepare("VACUUM INTO ?").run(target);
  return target;
}

function count(db: DatabaseSync, table: string): number {
  return Number((db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total);
}

describe("restoreFromFile", () => {
  it("yedekteki veriyi geri getirir ve aradaki değişiklikleri siler", () => {
    const source = createTestDb();
    const backup = writeBackup(source, "source.db");

    const target = createTestDb();
    const stateId = stateIdOfType(target, "core", "backlog");
    target
      .prepare(
        "INSERT INTO issues (id, project_id, title, state_id, priority, created_at) VALUES ('COR-900','core','sonradan',?, 'low','2026-01-01')",
      )
      .run(stateId);
    target.prepare("DELETE FROM issue_labels WHERE issue_id = 'COR-101'").run();

    restoreFromFile(target, backup);

    assert.equal(count(target, "issues"), count(source, "issues"));
    assert.equal(
      count(target, "issues WHERE id = 'COR-900'"),
      0,
      "yedekte olmayan issue geri yüklemeden sonra kalmamalı",
    );
    assert.equal(count(target, "issue_labels"), count(source, "issue_labels"));
  });

  it("görselleri (BLOB) ve durumları taşır", () => {
    const source = createTestDb();
    source
      .prepare(
        "INSERT INTO attachments (id, mime_type, data, created_at, issue_id) VALUES ('a1','image/png',x'0102','2026-01-01','COR-101')",
      )
      .run();
    const backup = writeBackup(source, "with-blob.db");

    const target = createTestDb();
    restoreFromFile(target, backup);

    const row = target.prepare("SELECT data FROM attachments WHERE id = 'a1'").get() as {
      data: Uint8Array;
    };
    assert.deepEqual([...row.data], [1, 2]);
    assert.equal(count(target, "workflow_states"), 5);
  });

  it("modüllerin açık/kapalı durumunu ve modül tablolarını taşır", () => {
    const source = createTestDb();
    const target = createTestDb();

    withFakeAttachmentModule([source, target], (addRef) => {
      setModuleEnabledDb(source, "test-attachments", true);
      addRef(source, "kaynakta");
      const backup = writeBackup(source, "with-module.db");

      addRef(target, "sonradan-eklenen");
      restoreFromFile(target, backup);
    });

    assert.deepEqual(
      target.prepare("SELECT id, enabled FROM modules").all().map((row) => ({ ...row })),
      [{ id: "test-attachments", enabled: 1 }],
    );
    assert.deepEqual(
      target.prepare("SELECT attachment_id FROM test_module_refs").all().map((row) => ({ ...row })),
      [{ attachment_id: "kaynakta" }],
    );
  });

  it("eksik kolonlu eski bir yedeği migration'lardan geçirir", () => {
    const legacy = new DatabaseSync(path.join(workDir, "legacy.db"));
    legacy.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE);
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, prefix TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE issues (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
        priority TEXT NOT NULL, created_at TEXT NOT NULL);
      INSERT INTO users VALUES ('u1','Eski','eski@example.com');
      INSERT INTO projects VALUES ('core','Core','COR','blue','2026-01-01');
      INSERT INTO issues VALUES ('COR-7','core','eski issue','low','2026-01-01');
    `);
    legacy.close();

    const target = createTestDb();
    restoreFromFile(target, path.join(workDir, "legacy.db"));

    const issue = target.prepare("SELECT state_id FROM issues WHERE id = 'COR-7'").get() as {
      state_id: string | null;
    };
    // Onarım migration'ı durumsuz issue'yu projenin backlog durumuna bağlamalı.
    assert.equal(issue.state_id, stateIdOfType(target, "core", "backlog"));
    assert.equal(count(target, "users"), 1);
  });
});
