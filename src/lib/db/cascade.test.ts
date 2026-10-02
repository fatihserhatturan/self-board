import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BookOpen } from "lucide-react";
import { deleteIssueCascade, deleteNoteCascade, deleteProjectCascade } from "@/lib/db/cascade";
import { createTestDb } from "@/lib/db/test-db";
import { MODULE_REGISTRY, type ModuleDefinition } from "@/lib/modules/registry";

const ATTACHMENT_ID = "0f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

function total(db: ReturnType<typeof createTestDb>, sql: string): number {
  return Number((db.prepare(sql).get() as { total: number }).total);
}

describe("deleteProjectCascade", () => {
  it("projeye bağlı durumlar dahil her şeyi siler", () => {
    const db = createTestDb();
    // Silinebilmesi için ikinci bir proje gerekmiyor — kontrol action'da.
    const deleted = deleteProjectCascade(db, "core");
    assert.equal(deleted, true);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM workflow_states WHERE project_id = 'core'"), 0);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM issues WHERE project_id = 'core'"), 0);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM issue_labels"), 0);
  });

  it("olmayan proje için false döner", () => {
    const db = createTestDb();
    assert.equal(deleteProjectCascade(db, "missing"), false);
  });

  it("per-project modüllerin onProjectDeleted hook'unu çağırır, global modüllerinkini çağırmaz", () => {
    const db = createTestDb();
    let perProjectCalledWith: string | null = null;
    let globalCalled = false;

    const fakeModule = (overrides: Partial<ModuleDefinition>): ModuleDefinition => ({
      id: "test-module",
      scope: "per-project",
      icon: BookOpen,
      nameKey: "nav.myIssues",
      descriptionKey: "nav.myIssues",
      nav: { href: "/my-issues", labelKey: "nav.myIssues" },
      ...overrides,
    });

    MODULE_REGISTRY.push(
      fakeModule({
        id: "test-per-project",
        scope: "per-project",
        onProjectDeleted: (_db, projectId) => {
          perProjectCalledWith = projectId;
        },
      }),
      fakeModule({
        id: "test-global",
        scope: "global",
        onProjectDeleted: () => {
          globalCalled = true;
        },
      }),
    );
    try {
      deleteProjectCascade(db, "core");
    } finally {
      MODULE_REGISTRY.length -= 2;
    }

    assert.equal(perProjectCalledWith, "core");
    assert.equal(globalCalled, false);
  });
});

describe("deleteIssueCascade", () => {
  it("etiket ve not satırlarını da siler", () => {
    const db = createTestDb();
    db.prepare(
      "INSERT INTO issue_notes (id, issue_id, body, created_at) VALUES ('n1', 'COR-101', 'x', '2026-01-01')",
    ).run();
    assert.equal(deleteIssueCascade(db, "COR-101"), true);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM issue_labels WHERE issue_id = 'COR-101'"), 0);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM issue_notes WHERE issue_id = 'COR-101'"), 0);
  });
});

describe("deleteNoteCascade", () => {
  it("notta geçen ve başka yerde referansı olmayan görseli siler", () => {
    const db = createTestDb();
    db.prepare(
      "INSERT INTO attachments (id, mime_type, data, created_at, issue_id) VALUES (?, 'image/png', x'00', '2026-01-01', 'COR-101')",
    ).run(ATTACHMENT_ID);
    db.prepare(
      "INSERT INTO issue_notes (id, issue_id, body, created_at) VALUES ('n1', 'COR-101', ?, '2026-01-01')",
    ).run(`<img src="/api/attachments/${ATTACHMENT_ID}">`);

    assert.equal(deleteNoteCascade(db, "n1"), true);
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM attachments"), 0);
  });

  it("açıklamada hâlâ geçen görseli korur", () => {
    const db = createTestDb();
    const html = `<img src="/api/attachments/${ATTACHMENT_ID}">`;
    db.prepare("UPDATE issues SET description = ? WHERE id = 'COR-101'").run(html);
    db.prepare(
      "INSERT INTO attachments (id, mime_type, data, created_at, issue_id) VALUES (?, 'image/png', x'00', '2026-01-01', 'COR-101')",
    ).run(ATTACHMENT_ID);
    db.prepare(
      "INSERT INTO issue_notes (id, issue_id, body, created_at) VALUES ('n1', 'COR-101', ?, '2026-01-01')",
    ).run(html);

    deleteNoteCascade(db, "n1");
    assert.equal(total(db, "SELECT COUNT(*) AS total FROM attachments"), 1);
  });

  it("olmayan not için false döner", () => {
    const db = createTestDb();
    assert.equal(deleteNoteCascade(db, "missing"), false);
  });
});
