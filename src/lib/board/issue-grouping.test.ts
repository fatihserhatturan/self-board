import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupIssues,
  statusTypeGroupId,
  UNSET_GROUP_ID,
  type GroupingContext,
} from "@/lib/board/issue-grouping";
import { STATUS_TYPES, type WorkflowState } from "@/lib/board/workflow-config";
import type { BoardIssue, IssueLabel, Person } from "@/lib/data/issues";
import type { Cycle } from "@/lib/data/cycles";

const todo: WorkflowState = {
  id: "s-todo",
  projectId: "p1",
  name: "Todo",
  type: "unstarted",
  color: "grey",
  icon: "circle",
  position: 0,
};
const done: WorkflowState = {
  id: "s-done",
  projectId: "p1",
  name: "Done",
  type: "completed",
  color: "green",
  icon: "circle-check",
  position: 1,
};

const ada: Person = { id: "u-ada", name: "Ada", email: "ada@example.com" };
const bug: IssueLabel = { id: "l-bug", name: "Bug", color: "red" };

const cycle: Cycle = {
  id: "c1",
  projectId: "p1",
  number: 1,
  name: null,
  startsAt: "2026-03-02",
  endsAt: "2026-03-15",
  totalIssues: 0,
  completedIssues: 0,
  counts: { backlog: 0, unstarted: 0, started: 0, completed: 0, canceled: 0 },
  createdAt: "2026-03-02T00:00:00.000Z",
};

function issue(overrides: Partial<BoardIssue> & { id: string }): BoardIssue {
  return {
    projectId: "p1",
    cycleId: null,
    title: overrides.id,
    state: todo,
    priority: "no-priority",
    labels: [],
    createdAt: "2026-03-02T00:00:00.000Z",
    ...overrides,
  };
}

const context: GroupingContext = {
  states: [todo, done],
  users: [ada],
  labels: [bug],
  cycles: [cycle],
};

const issues: BoardIssue[] = [
  issue({ id: "A", state: todo, assignee: ada, labels: [bug], cycleId: "c1", priority: "high" }),
  issue({ id: "B", state: done }),
];

describe("groupIssues — duruma göre", () => {
  it("proje durumlarını sırasıyla üretir ve bırakmaya izin verir", () => {
    const groups = groupIssues(issues, "status", context);
    assert.deepEqual(
      groups.map((group) => group.id),
      ["s-todo", "s-done"],
    );
    assert.deepEqual(
      groups.map((group) => group.issues.map((i) => i.id)),
      [["A"], ["B"]],
    );
    assert.ok(groups.every((group) => group.droppable));
  });

  it("proje yoksa beş sistem tipine düşer ve bırakmayı kapatır", () => {
    // My Issues projeler arası: her projenin durumları farklı, ortak payda tip.
    const groups = groupIssues(issues, "status", { ...context, states: null });
    assert.equal(groups.length, 5);
    assert.deepEqual(
      groups.map((group) => group.id),
      STATUS_TYPES.map(statusTypeGroupId),
    );
    assert.deepEqual(
      groups.find((group) => group.id === statusTypeGroupId("completed"))?.issues.map((i) => i.id),
      ["B"],
    );
    assert.ok(groups.every((group) => !group.droppable));
  });
});

describe("groupIssues — diğer alanlar", () => {
  it("atanana göre gruplar ve atanmamış kovası ekler", () => {
    const groups = groupIssues(issues, "assignee", context);
    assert.deepEqual(
      groups.map((group) => group.id),
      ["u-ada", UNSET_GROUP_ID],
    );
    assert.deepEqual(groups[0].issues.map((i) => i.id), ["A"]);
    assert.deepEqual(groups[1].issues.map((i) => i.id), ["B"]);
    assert.ok(groups.every((group) => group.droppable));
  });

  it("önceliğe göre gruplar", () => {
    const groups = groupIssues(issues, "priority", context);
    assert.deepEqual(
      groups.find((group) => group.id === "high")?.issues.map((i) => i.id),
      ["A"],
    );
    assert.deepEqual(
      groups.find((group) => group.id === "no-priority")?.issues.map((i) => i.id),
      ["B"],
    );
  });

  it("etikete göre gruplar ama bırakmayı kapatır", () => {
    // Bir issue birden çok etiket taşıyabildiği için "buraya taşı" tek anlamlı değil.
    const groups = groupIssues(issues, "label", context);
    assert.deepEqual(groups[0].issues.map((i) => i.id), ["A"]);
    assert.deepEqual(groups[1].issues.map((i) => i.id), ["B"]);
    assert.ok(groups.every((group) => !group.droppable));
  });

  it("cycle'a göre gruplar ve etiketi dışarıdan alır", () => {
    const groups = groupIssues(issues, "cycle", context, new Map([["c1", "Cycle 1"]]));
    assert.equal(groups[0].label, "Cycle 1");
    assert.deepEqual(groups[0].issues.map((i) => i.id), ["A"]);
    assert.deepEqual(groups[1].issues.map((i) => i.id), ["B"]);
  });
});
