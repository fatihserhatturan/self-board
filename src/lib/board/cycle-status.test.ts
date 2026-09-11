import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCycleStatus, isoDateFromDate, parseIsoDate } from "@/lib/board/cycle-status";

describe("getCycleStatus", () => {
  const cycle = { startsAt: "2026-03-02", endsAt: "2026-03-15" };

  it("başlangıçtan önce upcoming", () => {
    assert.equal(getCycleStatus(cycle, "2026-03-01"), "upcoming");
  });

  it("sınır günlerinde active", () => {
    assert.equal(getCycleStatus(cycle, "2026-03-02"), "active");
    assert.equal(getCycleStatus(cycle, "2026-03-15"), "active");
  });

  it("bitişten sonra completed", () => {
    assert.equal(getCycleStatus(cycle, "2026-03-16"), "completed");
  });
});

describe("isoDateFromDate / parseIsoDate", () => {
  it("yerel saat diliminde gidip geri döner", () => {
    assert.equal(isoDateFromDate(parseIsoDate("2026-03-04")), "2026-03-04");
  });

  it("gece yarısına yakın saatlerde günü kaydırmaz", () => {
    // `toISOString()` burada UTC'ye çevirip bir gün geri atardı.
    const lateEvening = new Date(2026, 2, 4, 23, 30, 0);
    assert.equal(isoDateFromDate(lateEvening), "2026-03-04");
  });

  it("tek haneli ay ve günü sıfırla doldurur", () => {
    assert.equal(isoDateFromDate(new Date(2026, 0, 5)), "2026-01-05");
  });
});
