import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countActiveFilters } from "@/lib/board/filter-summary";
import { EMPTY_FILTER_CRITERIA } from "@/lib/board/issue-view-config";

describe("countActiveFilters", () => {
  it("filtre yokken 0 döner", () => {
    assert.equal(countActiveFilters(EMPTY_FILTER_CRITERIA), 0);
  });

  it("cycle filtresini de sayar", () => {
    // Bu daha önce atlanıyordu: rozet ve view kartı eksik sayı gösteriyordu.
    assert.equal(
      countActiveFilters({ ...EMPTY_FILTER_CRITERIA, cycleIds: ["c1", "c2"] }),
      2,
    );
  });

  it("tüm kriter gruplarını toplar", () => {
    assert.equal(
      countActiveFilters({
        statuses: ["todo"],
        priorities: ["high", "urgent"],
        assigneeIds: ["u1"],
        labelIds: ["l1", "l2"],
        cycleIds: ["c1"],
      }),
      7,
    );
  });
});
