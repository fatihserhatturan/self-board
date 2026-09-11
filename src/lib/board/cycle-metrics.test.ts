import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  averageVelocity,
  buildBurnupSeries,
  buildTargetLine,
  capacityRatio,
  cycleDays,
  daysRemaining,
  successPercent,
} from "@/lib/board/cycle-metrics";

describe("successPercent", () => {
  it("boş cycle için 0 döner", () => {
    assert.equal(
      successPercent({ backlog: 0, todo: 0, inProgress: 0, done: 0, canceled: 0 }),
      0,
    );
  });

  it("canceled'ı tamamlanmış sayar", () => {
    assert.equal(
      successPercent({ backlog: 0, todo: 0, inProgress: 0, done: 1, canceled: 1 }),
      100,
    );
  });

  it("in-progress issue'ları çeyrek ağırlıkla sayar", () => {
    // 1 done + 1 in-progress (0.25) / 4 = %31
    assert.equal(
      successPercent({ backlog: 2, todo: 0, inProgress: 1, done: 1, canceled: 0 }),
      31,
    );
  });
});

describe("cycleDays", () => {
  it("başlangıç ve bitiş günlerini de içerir", () => {
    assert.deepEqual(cycleDays({ startsAt: "2026-03-02", endsAt: "2026-03-04" }), [
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
    ]);
  });

  it("ay sınırını aşar", () => {
    assert.deepEqual(cycleDays({ startsAt: "2026-02-27", endsAt: "2026-03-01" }), [
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
    ]);
  });
});

describe("buildTargetLine", () => {
  it("hafta sonlarında düzleşir", () => {
    // Pazartesi -> Pazar: 5 iş günü, cumartesi ve pazar aynı değerde kalmalı.
    const days = cycleDays({ startsAt: "2026-03-02", endsAt: "2026-03-08" });
    const target = buildTargetLine(days, 10);
    assert.equal(target[4], 10); // Cuma: tüm iş günleri bitti
    assert.equal(target[5], 10); // Cumartesi
    assert.equal(target[6], 10); // Pazar
  });

  it("tamamen hafta sonu olan cycle'da günlere eşit dağıtır", () => {
    const target = buildTargetLine(["2026-03-07", "2026-03-08"], 4);
    assert.deepEqual(target, [2, 4]);
  });
});

describe("daysRemaining", () => {
  it("bitiş gününü de sayar", () => {
    assert.equal(daysRemaining({ endsAt: "2026-03-04" }, "2026-03-02"), 3);
  });

  it("geçmiş cycle için negatife düşmez", () => {
    assert.equal(daysRemaining({ endsAt: "2026-03-01" }, "2026-03-10"), 0);
  });
});

describe("averageVelocity", () => {
  it("tamamlanmış cycle yoksa 0 döner", () => {
    assert.equal(averageVelocity([]), 0);
  });

  it("yalnızca son üç cycle'ı hesaba katar", () => {
    const cycles = [
      { completedIssues: 10 },
      { completedIssues: 8 },
      { completedIssues: 6 },
      { completedIssues: 100 },
    ];
    assert.equal(averageVelocity(cycles), 8);
  });
});

describe("capacityRatio", () => {
  it("hız bilinmiyorsa null döner", () => {
    assert.equal(capacityRatio(12, 0), null);
  });

  it("planlanan işin hıza oranını verir", () => {
    assert.equal(capacityRatio(12, 8), 1.5);
  });
});

describe("buildBurnupSeries", () => {
  const cycle = { startsAt: "2026-03-02", endsAt: "2026-03-04", totalIssues: 4 };

  it("bugünden sonraki günleri boş bırakır", () => {
    const series = buildBurnupSeries(cycle, [], "2026-03-02");
    assert.equal(series.length, 3);
    assert.equal(series[1].completed, null);
    assert.equal(series[2].scope, null);
  });

  it("snapshot olmayan günlerde bir önceki değeri taşır", () => {
    const series = buildBurnupSeries(
      cycle,
      [{ cycleId: "c1", date: "2026-03-02", scope: 4, started: 1, completed: 1 }],
      "2026-03-04",
    );
    assert.equal(series[1].completed, 1);
    assert.equal(series[2].completed, 1);
  });

  it("started serisini completed üzerine yığar", () => {
    const series = buildBurnupSeries(
      cycle,
      [{ cycleId: "c1", date: "2026-03-02", scope: 4, started: 2, completed: 1 }],
      "2026-03-02",
    );
    assert.equal(series[0].started, 3);
  });

  it("bugünü işaretler", () => {
    const series = buildBurnupSeries(cycle, [], "2026-03-03");
    assert.deepEqual(
      series.map((point) => point.isToday),
      [false, true, false],
    );
  });
});
