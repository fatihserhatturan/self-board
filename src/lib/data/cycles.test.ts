import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncCycles } from "@/lib/data/cycles";
import { createTestDb, stateIdOfType } from "@/lib/db/test-db";

function cycleOf(db: ReturnType<typeof createTestDb>, issueId: string): number | null {
  const row = db
    .prepare("SELECT c.number FROM issues i LEFT JOIN cycles c ON c.id = i.cycle_id WHERE i.id = ?")
    .get(issueId) as { number: number | null };
  return row.number;
}

describe("syncCycles", () => {
  it("ilk çağrıda aktif ve bir yaklaşan cycle oluşturur", () => {
    const db = createTestDb();
    const cycles = syncCycles(db, "core", "2026-03-02");
    assert.deepEqual(
      cycles.map((c) => [c.number, c.startsAt, c.endsAt]),
      [
        [2, "2026-03-16", "2026-03-29"],
        [1, "2026-03-02", "2026-03-15"],
      ],
    );
  });

  it("biten cycle'ın tamamlanmamış issue'larını devreder, tamamlananları bırakır", () => {
    const db = createTestDb();
    const [, first] = syncCycles(db, "core", "2026-03-02");
    const done = stateIdOfType(db, "core", "completed");
    const todo = stateIdOfType(db, "core", "unstarted");

    db.prepare("UPDATE issues SET cycle_id = ?, state_id = ? WHERE id = 'COR-101'").run(first.id, todo);
    db.prepare("UPDATE issues SET cycle_id = ?, state_id = ? WHERE id = 'COR-102'").run(first.id, done);

    // Birkaç cycle boyunca uygulama açılmadı: zincirleme yakalama.
    const cycles = syncCycles(db, "core", "2026-04-02");

    assert.equal(cycleOf(db, "COR-101"), 3);
    assert.equal(cycleOf(db, "COR-102"), 1);
    assert.deepEqual(
      cycles.map((c) => c.number),
      [4, 3, 2, 1],
    );

    // Kapanış snapshot'ı devirden önce alınmış olmalı: scope 2.
    const snapshot = db
      .prepare("SELECT scope, completed FROM cycle_snapshots WHERE cycle_id = ? AND date = '2026-03-15'")
      .get(first.id) as { scope: number; completed: number };
    assert.deepEqual({ ...snapshot }, { scope: 2, completed: 1 });
  });

  it("aynı gün tekrar çağrıldığında idempotent", () => {
    const db = createTestDb();
    syncCycles(db, "core", "2026-04-02");
    const before = syncCycles(db, "core", "2026-04-02");
    const after = syncCycles(db, "core", "2026-04-02");
    assert.deepEqual(after, before);
  });

  it("olmayan proje için boş liste döner", () => {
    const db = createTestDb();
    assert.deepEqual(syncCycles(db, "missing", "2026-04-02"), []);
  });
});
