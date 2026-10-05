import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DatabaseSync } from "node:sqlite";
import { deleteProjectCascade } from "@/lib/db/cascade";
import { pruneOrphanedAttachments } from "@/lib/db/attachment-links";
import { seedProjectStates } from "@/lib/db/schema";
import { createTestDb, insertTestAttachment } from "@/lib/db/test-db";
import {
  deleteWikiPageSubtreeDb,
  insertWikiPageDb,
  listWikiSearchEntriesDb,
  listWikiTreeDb,
  moveWikiPageDb,
  readWikiPageDb,
  reparentWikiPageDb,
  updateWikiPageContentDb,
} from "@/lib/modules/wiki/db";

const IMG_A = "0f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const IMG_B = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5e";

function img(id: string): string {
  return `<img src="/api/attachments/${id}">`;
}

function createPage(db: DatabaseSync, parentId: string | null = null, projectId = "core"): string {
  const result = insertWikiPageDb(db, projectId, parentId);
  assert.equal(result.ok, true);
  return (result as { ok: true; data: { id: string } }).data.id;
}

function addProject(db: DatabaseSync, id: string): void {
  db.prepare(
    "INSERT INTO projects (id, name, prefix, color, created_at) VALUES (?, ?, ?, 'grey', '2026-01-01')",
  ).run(id, id, id.toUpperCase().slice(0, 3));
  seedProjectStates(db, id);
}

function positions(db: DatabaseSync, parentId: string | null): [string, number][] {
  return listWikiTreeDb(db, "core")
    .filter((node) => node.parentId === parentId)
    .map((node) => [node.id, node.position]);
}

function refs(db: DatabaseSync, pageId: string): string[] {
  return (
    db
      .prepare("SELECT attachment_id FROM wiki_page_attachments WHERE page_id = ? ORDER BY attachment_id")
      .all(pageId) as { attachment_id: string }[]
  ).map((row) => row.attachment_id);
}

describe("insertWikiPageDb", () => {
  it("kökte ve ebeveyn altında kardeşlerin sonuna ekler", () => {
    const db = createTestDb();
    const a = createPage(db);
    const b = createPage(db);
    const child = createPage(db, a);

    assert.deepEqual(positions(db, null), [
      [a, 0],
      [b, 1],
    ]);
    assert.deepEqual(positions(db, a), [[child, 0]]);
  });

  it("başka projenin ebeveynini ve olmayan projeyi reddeder", () => {
    const db = createTestDb();
    addProject(db, "other");
    const foreign = createPage(db, null, "other");

    assert.deepEqual(insertWikiPageDb(db, "core", foreign), { ok: false, error: "parent-not-found" });
    assert.deepEqual(insertWikiPageDb(db, "missing", null), { ok: false, error: "project-not-found" });
  });
});

describe("updateWikiPageContentDb", () => {
  it("başlık ve gövdeyi yazar, değişmeyen içerikte updated_at ilerlemez", () => {
    const db = createTestDb();
    const id = createPage(db);

    const first = updateWikiPageContentDb(db, id, { title: "  Mimari  ", body: "<p>a</p>" }, new Date("2026-05-01T10:00:00Z"));
    assert.deepEqual(first, { ok: true, data: { updatedAt: "2026-05-01T10:00:00.000Z" } });

    const same = updateWikiPageContentDb(db, id, { title: "Mimari", body: "<p>a</p>" }, new Date("2026-05-02T10:00:00Z"));
    assert.deepEqual(same, { ok: true, data: { updatedAt: "2026-05-01T10:00:00.000Z" } });

    const page = readWikiPageDb(db, id);
    assert.equal(page?.title, "Mimari");
    assert.equal(page?.body, "<p>a</p>");
  });

  it("başlığı sınırlar, olmayan sayfa için page-not-found döner", () => {
    const db = createTestDb();
    const id = createPage(db);
    updateWikiPageContentDb(db, id, { title: "x".repeat(500), body: "" });
    assert.equal(readWikiPageDb(db, id)?.title.length, 200);
    assert.deepEqual(updateWikiPageContentDb(db, "missing", { title: "a", body: "" }), {
      ok: false,
      error: "page-not-found",
    });
  });

  it("gövdedeki ekleri eşler, var olmayanı atlar, çıkarılanın eşlemesini siler", () => {
    const db = createTestDb();
    const id = createPage(db);
    insertTestAttachment(db, IMG_A);

    updateWikiPageContentDb(db, id, { title: "t", body: img(IMG_A) + img(IMG_B) });
    assert.deepEqual(refs(db, id), [IMG_A], "var olmayan IMG_B FK hatası üretmeden atlanmalı");

    updateWikiPageContentDb(db, id, { title: "t", body: "<p>görselsiz</p>" });
    assert.deepEqual(refs(db, id), []);
  });

  it("wiki'nin kullandığı eski görseli prune silmez", () => {
    const db = createTestDb();
    const id = createPage(db);
    insertTestAttachment(db, IMG_A);
    insertTestAttachment(db, IMG_B);
    updateWikiPageContentDb(db, id, { title: "t", body: img(IMG_A) });

    pruneOrphanedAttachments(db);

    const remaining = (db.prepare("SELECT id FROM attachments").all() as { id: string }[]).map((r) => r.id);
    assert.deepEqual(remaining, [IMG_A]);
  });
});

describe("moveWikiPageDb", () => {
  it("yalnız aynı ebeveynin çocukları arasında takas eder, uçlarda bir şey yapmaz", () => {
    const db = createTestDb();
    const a = createPage(db);
    const b = createPage(db);
    const child = createPage(db, a);

    moveWikiPageDb(db, b, "up");
    assert.deepEqual(positions(db, null), [
      [b, 0],
      [a, 1],
    ]);

    moveWikiPageDb(db, b, "up");
    moveWikiPageDb(db, child, "down");
    assert.deepEqual(positions(db, null), [
      [b, 0],
      [a, 1],
    ]);
    assert.deepEqual(positions(db, a), [[child, 0]]);
  });
});

describe("reparentWikiPageDb", () => {
  it("sayfayı kendisinin ya da torununun altına taşımayı reddeder", () => {
    const db = createTestDb();
    const a = createPage(db);
    const child = createPage(db, a);
    const grandchild = createPage(db, child);

    assert.deepEqual(reparentWikiPageDb(db, a, a), { ok: false, error: "parent-cycle" });
    assert.deepEqual(reparentWikiPageDb(db, a, grandchild), { ok: false, error: "parent-cycle" });
  });

  it("başka projenin sayfasını reddeder", () => {
    const db = createTestDb();
    addProject(db, "other");
    const a = createPage(db);
    const foreign = createPage(db, null, "other");
    assert.deepEqual(reparentWikiPageDb(db, a, foreign), { ok: false, error: "parent-not-found" });
  });

  it("yeni ebeveynin sonuna taşır, köke geri alır, updated_at değişmez", () => {
    const db = createTestDb();
    const a = createPage(db);
    const existing = createPage(db, a);
    const b = createPage(db);
    const before = readWikiPageDb(db, b)?.updatedAt;

    assert.equal(reparentWikiPageDb(db, b, a).ok, true);
    assert.deepEqual(positions(db, a), [
      [existing, 0],
      [b, 1],
    ]);
    assert.equal(readWikiPageDb(db, b)?.updatedAt, before);

    assert.equal(reparentWikiPageDb(db, b, null).ok, true);
    assert.equal(readWikiPageDb(db, b)?.parentId, null);
  });
});

describe("deleteWikiPageSubtreeDb", () => {
  it("sayfayı, torunlarını ve eşlemelerini siler; kardeşler kalır", () => {
    const db = createTestDb();
    const a = createPage(db);
    const child = createPage(db, a);
    const grandchild = createPage(db, child);
    const sibling = createPage(db);
    insertTestAttachment(db, IMG_A);
    updateWikiPageContentDb(db, grandchild, { title: "t", body: img(IMG_A) });

    const result = deleteWikiPageSubtreeDb(db, a);
    assert.equal(result.ok, true);
    assert.deepEqual(
      new Set((result as { ok: true; data: { deletedIds: string[] } }).data.deletedIds),
      new Set([a, child, grandchild]),
    );
    assert.deepEqual(
      listWikiTreeDb(db, "core").map((node) => node.id),
      [sibling],
    );
    assert.deepEqual(refs(db, grandchild), []);
  });

  it("olmayan sayfa için page-not-found döner", () => {
    const db = createTestDb();
    assert.deepEqual(deleteWikiPageSubtreeDb(db, "missing"), { ok: false, error: "page-not-found" });
  });
});

describe("listWikiSearchEntriesDb", () => {
  it("tüm projelerin sayfalarını son düzenlenen önce ve sayfa bağlantısıyla döner", () => {
    const db = createTestDb();
    addProject(db, "other");
    const older = createPage(db);
    const newer = createPage(db, null, "other");
    updateWikiPageContentDb(db, older, { title: "Eski", body: "" }, new Date("2026-01-01T00:00:00Z"));
    updateWikiPageContentDb(db, newer, { title: "Yeni", body: "" }, new Date("2026-02-01T00:00:00Z"));

    assert.deepEqual(listWikiSearchEntriesDb(db), [
      { moduleId: "wiki", id: newer, title: "Yeni", projectId: "other", href: `/wiki?project=other&page=${newer}` },
      { moduleId: "wiki", id: older, title: "Eski", projectId: "core", href: `/wiki?project=core&page=${older}` },
    ]);
  });
});

describe("deleteProjectCascade — wiki", () => {
  it("yalnız silinen projenin wiki'sini siler", () => {
    const db = createTestDb();
    addProject(db, "other");
    const mine = createPage(db);
    createPage(db, mine);
    const kept = createPage(db, null, "other");
    insertTestAttachment(db, IMG_A);
    updateWikiPageContentDb(db, mine, { title: "t", body: img(IMG_A) });

    assert.equal(deleteProjectCascade(db, "core"), true);

    const remaining = (db.prepare("SELECT id FROM wiki_pages").all() as { id: string }[]).map((r) => r.id);
    assert.deepEqual(remaining, [kept]);
    assert.equal(
      Number((db.prepare("SELECT COUNT(*) AS c FROM wiki_page_attachments").get() as { c: number }).c),
      0,
    );
  });
});
