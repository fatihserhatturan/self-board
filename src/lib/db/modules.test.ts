import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTestDb } from "@/lib/db/test-db";
import { getEnabledModuleIdsDb, setModuleEnabledDb } from "@/lib/db/modules";

describe("getEnabledModuleIdsDb / setModuleEnabledDb", () => {
  it("hiç dokunulmamış modül kapalı kabul edilir", () => {
    const db = createTestDb();
    assert.deepEqual(getEnabledModuleIdsDb(db), []);
  });

  it("enable/disable idempotent", () => {
    const db = createTestDb();
    setModuleEnabledDb(db, "wiki", true);
    setModuleEnabledDb(db, "wiki", true); // ikinci çağrı hata vermemeli
    assert.deepEqual(getEnabledModuleIdsDb(db), ["wiki"]);

    setModuleEnabledDb(db, "wiki", false);
    setModuleEnabledDb(db, "wiki", false);
    assert.deepEqual(getEnabledModuleIdsDb(db), []);
  });

  it("kapatmak satırı silmiyor, sadece enabled=0 yapıyor (non-destructive)", () => {
    const db = createTestDb();
    setModuleEnabledDb(db, "wiki", true);
    setModuleEnabledDb(db, "wiki", false);
    const row = db.prepare("SELECT enabled FROM modules WHERE id = ?").get("wiki") as {
      enabled: number;
    };
    assert.equal(row.enabled, 0);
  });

  it("birden fazla modül birbirinden bağımsız", () => {
    const db = createTestDb();
    setModuleEnabledDb(db, "wiki", true);
    setModuleEnabledDb(db, "docs", true);
    setModuleEnabledDb(db, "wiki", false);
    assert.deepEqual(getEnabledModuleIdsDb(db), ["docs"]);
  });
});
