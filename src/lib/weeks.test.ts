import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  isMonday,
  mondayOf,
  monthRange,
  weekInfo,
  weeksOfMonth,
} from "./weeks.ts";

test("setiap bulan punya 4 atau 5 minggu, berurutan tanpa celah", () => {
  let prevEnd: string | null = null;
  for (let i = 0; i < 12 * 30; i++) {
    const month = addMonths("2010-01", i);
    const weeks = weeksOfMonth(month);
    assert.ok(weeks.length === 4 || weeks.length === 5, `${month}: ${weeks.length}`);
    for (const w of weeks) {
      assert.ok(isMonday(w.start), `${w.start} bukan Senin`);
      if (prevEnd) {
        const d: Date = new Date(prevEnd + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        assert.equal(w.start, d.toISOString().slice(0, 10));
      }
      prevEnd = w.end;
    }
  }
});

test("contoh konkret", () => {
  // 1 Jan 2026 = Kamis → minggu 29 Des 2025 milik Januari 2026
  assert.equal(weeksOfMonth("2026-01")[0].start, "2025-12-29");
  assert.equal(weeksOfMonth("2026-01").length, 5);
  // Feb 2026 dimulai Minggu → minggu pertama Senin 2 Feb
  assert.equal(weeksOfMonth("2026-02")[0].start, "2026-02-02");
  assert.equal(weeksOfMonth("2026-02").length, 4);
});

test("mondayOf & weekInfo", () => {
  assert.equal(mondayOf("2026-11-26"), "2026-11-23");
  assert.equal(mondayOf("2026-11-23"), "2026-11-23");
  assert.equal(mondayOf("2026-11-29"), "2026-11-23");
  const w = weekInfo("2026-11-23");
  assert.equal(w.month, "2026-11");
  assert.equal(w.index, 4);
});

test("monthRange membatasi rentang & lintas tahun", () => {
  const r = monthRange("2026-11", "2027-02");
  assert.deepEqual(r.map((m) => m.month), ["2026-11", "2026-12", "2027-01", "2027-02"]);
  assert.equal(monthRange("2026-01", "2030-01").length, 24);
  assert.equal(monthRange("2026-05", "2026-01").length, 1);
});
