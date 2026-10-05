import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAttachmentIds,
  moduleAttachmentRefsSql,
  pruneOrphanedAttachments,
  releaseIssueAttachments,
  syncIssueAttachments,
} from "@/lib/db/attachment-links";
import { createTestDb, insertTestAttachment, withFakeAttachmentModule } from "@/lib/db/test-db";

const ID_A = "0f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const ID_B = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5e";

/** `node:sqlite` satırları null-prototype nesne; `deepStrictEqual` için düz nesneye çevriliyor. */
function attachmentRow(db: ReturnType<typeof createTestDb>, id: string) {
  const row = db.prepare("SELECT issue_id FROM attachments WHERE id = ?").get(id) as
    | { issue_id: string | null }
    | undefined;
  return row ? { ...row } : undefined;
}

describe("extractAttachmentIds", () => {
  it("gövde boşsa boş dizi döner", () => {
    assert.deepEqual(extractAttachmentIds(""), []);
  });

  it("img src'sindeki id'yi bulur", () => {
    assert.deepEqual(extractAttachmentIds(`<p><img src="/api/attachments/${ID_A}"></p>`), [ID_A]);
  });

  it("birden fazla referansı sırayla döndürür", () => {
    const html = `<img src="/api/attachments/${ID_A}"><img src="/api/attachments/${ID_B}">`;
    assert.deepEqual(extractAttachmentIds(html), [ID_A, ID_B]);
  });

  it("attachment olmayan URL'leri yok sayar", () => {
    assert.deepEqual(extractAttachmentIds('<img src="https://example.com/a.png">'), []);
  });
});

describe("moduleAttachmentRefsSql", () => {
  it("ek kullanan modül yoksa null", () => {
    assert.equal(moduleAttachmentRefsSql(), null);
  });
});

describe("pruneOrphanedAttachments", () => {
  it("eski yetim eki siler, bir modülün kullandığını korur", () => {
    const db = createTestDb();
    insertTestAttachment(db, ID_A);
    insertTestAttachment(db, ID_B);

    withFakeAttachmentModule([db], (addRef) => {
      addRef(db, ID_A);
      pruneOrphanedAttachments(db);
    });

    assert.ok(attachmentRow(db, ID_A), "modülün eki kalmalı");
    assert.equal(attachmentRow(db, ID_B), undefined);
  });

  it("yeni yüklenmiş (24 saatten genç) yetimi silmez", () => {
    const db = createTestDb();
    insertTestAttachment(db, ID_A, { createdAt: new Date().toISOString() });
    pruneOrphanedAttachments(db);
    assert.ok(attachmentRow(db, ID_A));
  });
});

describe("syncIssueAttachments", () => {
  it("açıklamadan çıkan görsel modül tarafından kullanılıyorsa silinmez, issue'dan ayrılır", () => {
    const db = createTestDb();
    insertTestAttachment(db, ID_A, { issueId: "COR-101" });
    insertTestAttachment(db, ID_B, { issueId: "COR-101" });

    withFakeAttachmentModule([db], (addRef) => {
      addRef(db, ID_A);
      syncIssueAttachments(db, "COR-101", "<p>görselsiz</p>");
    });

    assert.deepEqual(attachmentRow(db, ID_A), { issue_id: null });
    assert.equal(attachmentRow(db, ID_B), undefined);
  });
});

describe("releaseIssueAttachments", () => {
  it("modülün kullandığı eki ayırır, kalanını siler", () => {
    const db = createTestDb();
    insertTestAttachment(db, ID_A, { issueId: "COR-101" });
    insertTestAttachment(db, ID_B, { issueId: "COR-101" });

    withFakeAttachmentModule([db], (addRef) => {
      addRef(db, ID_A);
      releaseIssueAttachments(db, "?", "COR-101");
    });

    assert.deepEqual(attachmentRow(db, ID_A), { issue_id: null });
    assert.equal(attachmentRow(db, ID_B), undefined);
  });
});
