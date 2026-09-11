import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTypingTarget } from "@/lib/keyboard";

/**
 * `isTypingTarget` `instanceof HTMLElement` kontrolü yapıyor; Node'da DOM
 * olmadığı için testler minimal birer sahte sınıf kuruyor.
 */
class FakeHTMLElement extends EventTarget {
  tagName: string;
  isContentEditable: boolean;

  constructor(tagName: string, isContentEditable = false) {
    super();
    this.tagName = tagName;
    this.isContentEditable = isContentEditable;
  }
}

const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;
(globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;

describe("isTypingTarget", () => {
  it("null hedef için false", () => {
    assert.equal(isTypingTarget(null), false);
  });

  it("input, textarea ve select için true", () => {
    assert.equal(isTypingTarget(new FakeHTMLElement("INPUT")), true);
    assert.equal(isTypingTarget(new FakeHTMLElement("TEXTAREA")), true);
    assert.equal(isTypingTarget(new FakeHTMLElement("SELECT")), true);
  });

  it("contenteditable için true — Tiptap editörü bir div", () => {
    assert.equal(isTypingTarget(new FakeHTMLElement("DIV", true)), true);
  });

  it("sıradan bir eleman için false", () => {
    assert.equal(isTypingTarget(new FakeHTMLElement("DIV")), false);
  });
});

process.on("exit", () => {
  (globalThis as { HTMLElement?: unknown }).HTMLElement = originalHTMLElement;
});
