import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTestDb } from "@/lib/db/test-db";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

describe("MODULE_REGISTRY", () => {
  it("id'ler benzersiz", () => {
    const ids = MODULE_REGISTRY.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("her modülün tabloları şema kurulunca var ve ek sorgusu çalışıyor", () => {
    const db = createTestDb();
    const tables = new Set(
      (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
        (row) => row.name,
      ),
    );
    for (const entry of MODULE_REGISTRY) {
      for (const table of entry.tables ?? []) {
        assert.ok(tables.has(table), `${entry.id}: ${table} tablosu kurulmamış`);
      }
      if (entry.attachmentRefsSql) {
        assert.doesNotThrow(() => db.prepare(entry.attachmentRefsSql!).all(), entry.id);
      }
    }
  });
});
