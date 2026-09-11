import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractAttachmentIds } from "@/lib/db/attachment-links";

const ID_A = "0f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const ID_B = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5e";

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
