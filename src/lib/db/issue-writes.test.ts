import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IssueFormValues } from "@/lib/actions/issues";
import { insertIssue, updateIssueRow } from "@/lib/db/issue-writes";
import { seedProjectStates } from "@/lib/db/schema";
import { createTestDb, stateIdOfType } from "@/lib/db/test-db";

function form(overrides: Partial<IssueFormValues>): IssueFormValues {
  return {
    title: "Yeni issue",
    description: "",
    stateId: "",
    priority: "medium",
    assigneeId: null,
    cycleId: null,
    labelIds: [],
    ...overrides,
  };
}

function withSecondProject() {
  const db = createTestDb();
  db.prepare(
    "INSERT INTO projects (id, name, prefix, color, created_at) VALUES ('other', 'Other', 'OTH', 'grey', '2026-01-01')",
  ).run();
  seedProjectStates(db, "other");
  return db;
}

describe("insertIssue", () => {
  it("boş durumla oluşturmayı reddeder", () => {
    const db = createTestDb();
    const result = insertIssue(db, "core", form({ stateId: "" }));
    assert.deepEqual(result, { ok: false, error: "state-invalid" });
  });

  it("başka projenin durumunu reddeder", () => {
    const db = withSecondProject();
    const foreign = stateIdOfType(db, "other", "backlog");
    const result = insertIssue(db, "core", form({ stateId: foreign }));
    assert.deepEqual(result, { ok: false, error: "state-invalid" });
  });

  it("geçersiz önceliği ve bilinmeyen atananı reddeder", () => {
    const db = createTestDb();
    const stateId = stateIdOfType(db, "core", "backlog");
    assert.deepEqual(
      insertIssue(db, "core", form({ stateId, priority: "critical" as IssueFormValues["priority"] })),
      { ok: false, error: "priority-invalid" },
    );
    assert.deepEqual(insertIssue(db, "core", form({ stateId, assigneeId: "nobody" })), {
      ok: false,
      error: "assignee-invalid",
    });
  });

  it("reddedilen istek sayaç numarası harcamaz", () => {
    const db = createTestDb();
    insertIssue(db, "core", form({ stateId: "" }));
    const stateId = stateIdOfType(db, "core", "backlog");
    const result = insertIssue(db, "core", form({ stateId }));
    assert.deepEqual(result, { ok: true, data: { id: "COR-121" } });
  });

  it("var olmayan etiketleri ve tekrarları atar", () => {
    const db = createTestDb();
    const stateId = stateIdOfType(db, "core", "backlog");
    const result = insertIssue(db, "core", form({ stateId, labelIds: ["bug", "bug", "ghost"] }));
    assert.equal(result.ok, true);
    const labels = db
      .prepare("SELECT label_id FROM issue_labels WHERE issue_id = 'COR-121'")
      .all() as { label_id: string }[];
    assert.deepEqual(
      labels.map((row) => row.label_id),
      ["bug"],
    );
  });
});

describe("updateIssueRow", () => {
  it("issue'yu başka projenin durumuna taşımayı reddeder", () => {
    const db = withSecondProject();
    const foreign = stateIdOfType(db, "other", "started");
    const result = updateIssueRow(db, "COR-101", form({ stateId: foreign }));
    assert.deepEqual(result, { ok: false, error: "state-invalid" });
  });

  it("olmayan issue için issue-not-found döner", () => {
    const db = createTestDb();
    const stateId = stateIdOfType(db, "core", "backlog");
    assert.deepEqual(updateIssueRow(db, "COR-999", form({ stateId })), {
      ok: false,
      error: "issue-not-found",
    });
  });
});
