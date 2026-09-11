import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cn } from "@/lib/utils";

/**
 * Bu testler `cn()`'in özel yazı ölçeğini (`text-mini`, `text-small`, …) metin
 * rengiyle karıştırmadığını bekliyor. Yapılandırma olmadan tailwind-merge ikisini
 * aynı sınıf grubuna koyuyor ve yalnızca sonuncuyu bırakıyordu; bu, düğme
 * yazısının rengini düşürüp aydınlık temada siyah çıkmasına yol açıyordu.
 */
describe("cn — yazı boyutu ve metin rengi bir arada", () => {
  it("küçük düğmede hem boyutu hem rengi korur", () => {
    const out = cn("text-small", "bg-accent text-text-on-accent", "h-7 px-2.5 text-mini");
    assert.ok(out.includes("text-text-on-accent"), out);
    assert.ok(out.includes("text-mini"), out);
    assert.ok(!out.includes("text-small"), out);
  });

  it("büyük düğmede hem boyutu hem rengi korur", () => {
    const out = cn("text-small", "bg-accent text-text-on-accent", "h-10 px-4 text-large");
    assert.ok(out.includes("text-text-on-accent"), out);
    assert.ok(out.includes("text-large"), out);
  });

  it("rozette etiket rengi düşmez", () => {
    const out = cn("bg-label-red/15 text-label-red", "px-2 py-0.5 text-micro");
    assert.ok(out.includes("text-label-red"), out);
    assert.ok(out.includes("text-micro"), out);
  });

  it("renk sınıfı boyut sınıfını yutmaz", () => {
    const out = cn("text-micro text-text-secondary");
    assert.ok(out.includes("text-micro"), out);
    assert.ok(out.includes("text-text-secondary"), out);
  });

  it("özel yardımcı boyutu da tanınır", () => {
    const out = cn("text-large-medium text-text-primary");
    assert.ok(out.includes("text-large-medium"), out);
    assert.ok(out.includes("text-text-primary"), out);
  });
});

describe("cn — gerçek çakışmalar hâlâ çözülüyor", () => {
  it("aynı gruptaki iki özel boyuttan sonuncusu kazanır", () => {
    assert.equal(cn("text-small", "text-large"), "text-large");
  });

  it("aynı gruptaki iki metin renginden sonuncusu kazanır", () => {
    assert.equal(cn("text-text-primary", "text-text-tertiary"), "text-text-tertiary");
  });

  it("Tailwind'in kendi ölçeği bozulmaz", () => {
    assert.equal(cn("text-sm", "text-lg"), "text-lg");
  });

  it("renk dışı gruplar etkilenmez", () => {
    assert.equal(cn("rounded-md", "rounded-lg"), "rounded-lg");
    assert.equal(cn("shadow-button-2", "shadow-dropdown"), "shadow-dropdown");
  });
});
