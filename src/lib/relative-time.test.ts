import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickRelativeUnit } from "@/lib/relative-time";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("pickRelativeUnit", () => {
  it("45 saniyeden kısası şimdi", () => {
    assert.deepEqual(pickRelativeUnit(-10_000), { value: 0, unit: "second" });
    assert.deepEqual(pickRelativeUnit(20_000), { value: 0, unit: "second" });
  });

  it("dakikadan kısa ama eşiği geçen fark saniye", () => {
    assert.deepEqual(pickRelativeUnit(-50_000), { value: -50, unit: "second" });
  });

  it("birim eşiklerinde doğru birimi seçer", () => {
    assert.deepEqual(pickRelativeUnit(-5 * MINUTE), { value: -5, unit: "minute" });
    assert.deepEqual(pickRelativeUnit(-3 * HOUR), { value: -3, unit: "hour" });
    assert.deepEqual(pickRelativeUnit(-2 * DAY), { value: -2, unit: "day" });
    assert.deepEqual(pickRelativeUnit(-14 * DAY), { value: -2, unit: "week" });
    assert.deepEqual(pickRelativeUnit(-60 * DAY), { value: -2, unit: "month" });
    assert.deepEqual(pickRelativeUnit(-800 * DAY), { value: -2, unit: "year" });
  });

  it("yuvarlamaz, sıfıra doğru kırpar", () => {
    assert.deepEqual(pickRelativeUnit(-59.6 * MINUTE), { value: -59, unit: "minute" });
  });
});
