import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeHtmlEntities, isBlockedAddress } from "@/lib/link-preview-safety";

describe("isBlockedAddress", () => {
  it("yerel ve özel IPv4 adreslerini engeller", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.1.10",
      "172.20.0.5",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
    ]) {
      assert.equal(isBlockedAddress(address), true, address);
    }
  });

  it("IPv4-mapped IPv6 ile kaçışı engeller", () => {
    assert.equal(isBlockedAddress("::ffff:127.0.0.1"), true);
  });

  it("yerel ve özel IPv6 adreslerini engeller", () => {
    for (const address of ["::1", "fc00::1", "fe80::1", "ff02::1"]) {
      assert.equal(isBlockedAddress(address), true, address);
    }
  });

  it("herkese açık adreslere izin verir", () => {
    for (const address of ["93.184.216.34", "8.8.8.8", "2606:2800:220:1:248:1893:25c8:1946"]) {
      assert.equal(isBlockedAddress(address), false, address);
    }
  });

  it("IP olmayan değeri engeller", () => {
    assert.equal(isBlockedAddress("not-an-ip"), true);
  });
});

describe("decodeHtmlEntities", () => {
  it("adlandırılmış ve sayısal entity'leri çözer", () => {
    assert.equal(decodeHtmlEntities("Foo &amp; Bar"), "Foo & Bar");
    assert.equal(decodeHtmlEntities("&lt;tag&gt;"), "<tag>");
    assert.equal(decodeHtmlEntities("Ali&#39;nin"), "Ali'nin");
    assert.equal(decodeHtmlEntities("&#x41;BC"), "ABC");
  });

  it("bilinmeyen entity'i olduğu gibi bırakır", () => {
    assert.equal(decodeHtmlEntities("&unknown; &amp;"), "&unknown; &");
  });
});
