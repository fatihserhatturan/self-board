import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findIssueRefs } from "@/lib/issue-refs";

describe("findIssueRefs", () => {
  it("kimliği ve konumunu bulur", () => {
    assert.deepEqual(findIssueRefs("bkz. COR-12 ve WEB-3"), [
      { from: 5, to: 11, id: "COR-12" },
      { from: 15, to: 20, id: "WEB-3" },
    ]);
  });

  it("noktalama ve parantezle sınırlı kimliği bulur", () => {
    assert.deepEqual(
      findIssueRefs("(COR-1), COR-2.").map((match) => match.id),
      ["COR-1", "COR-2"],
    );
  });

  it("kelimenin parçasını ya da geçersiz öneki eşleştirmez", () => {
    assert.deepEqual(findIssueRefs("cor-12 ABCDEF-1 COR-12a A-1"), []);
    assert.deepEqual(
      findIssueRefs("XCOR-12").map((match) => match.id),
      ["XCOR-12"],
      "COR-12 olarak değil, bütün kelime olarak",
    );
  });
});
