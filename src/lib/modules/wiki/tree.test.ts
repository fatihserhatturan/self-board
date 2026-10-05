import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ancestorIds,
  childrenByParent,
  pagePath,
  recentPages,
  subtreeIds,
  type WikiTreeNode,
} from "@/lib/modules/wiki/tree";

function node(id: string, parentId: string | null, position: number, updatedAt = "2026-01-01"): WikiTreeNode {
  return { id, parentId, title: id, position, updatedAt };
}

// a ─┬─ b ── c
//    └─ d
// e
const NODES = [
  node("a", null, 0, "2026-01-03"),
  node("b", "a", 1, "2026-01-05"),
  node("c", "b", 0, "2026-01-01"),
  node("d", "a", 0, "2026-01-04"),
  node("e", null, 1, "2026-01-02"),
];

describe("wiki tree", () => {
  it("childrenByParent pozisyona göre sıralar", () => {
    const children = childrenByParent(NODES);
    assert.deepEqual(children.get(null)?.map((n) => n.id), ["a", "e"]);
    assert.deepEqual(children.get("a")?.map((n) => n.id), ["d", "b"]);
  });

  it("ancestorIds kendisini içermez", () => {
    assert.deepEqual(ancestorIds(NODES, "c"), new Set(["b", "a"]));
    assert.deepEqual(ancestorIds(NODES, "a"), new Set());
  });

  it("ancestorIds bozuk veride döngüye girmez", () => {
    const cyclic = [node("x", "y", 0), node("y", "x", 0)];
    assert.deepEqual(ancestorIds(cyclic, "x"), new Set(["y", "x"]));
  });

  it("subtreeIds kendisini ve torunlarını içerir", () => {
    assert.deepEqual(subtreeIds(NODES, "a"), new Set(["a", "b", "c", "d"]));
    assert.deepEqual(subtreeIds(NODES, "e"), new Set(["e"]));
  });

  it("pagePath kökten sayfaya", () => {
    assert.deepEqual(pagePath(NODES, "c").map((n) => n.id), ["a", "b", "c"]);
  });

  it("recentPages yeniden eskiye ve sınırlı", () => {
    assert.deepEqual(recentPages(NODES, 3).map((n) => n.id), ["b", "d", "a"]);
  });
});
