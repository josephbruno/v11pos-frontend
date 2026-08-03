import { describe, expect, it } from "vitest";
import {
  formatISTDate,
  formatISTDateTimeCompact,
  getISTTodayRange,
  isWithinISTRange,
  istDatetimeLocalToNaiveIso,
  toISTDatetimeLocalValue,
} from "./istDate";

describe("istDate", () => {
  it("buckets late-night UTC into the correct IST calendar day", () => {
    // 2026-06-25 20:00 UTC = 2026-06-26 01:30 IST
    const instant = new Date("2026-06-25T20:00:00.000Z");
    expect(formatISTDate(instant)).toBe("2026-06-26");
  });

  it("treats naive API timestamps as UTC when formatting IST", () => {
    // 05:02 UTC → 10:32 IST
    expect(formatISTDateTimeCompact("2026-08-03T05:02:57")).toMatch(/10:32/i);
    expect(formatISTDateTimeCompact("2026-08-03T05:02:57Z")).toMatch(/10:32/i);
    expect(formatISTDateTimeCompact("2026-08-03T10:32:57+05:30")).toMatch(/10:32/i);
  });

  it("defines today range with +05:30 offset", () => {
    const { start, end } = getISTTodayRange();
    expect(start).toMatch(/\+05:30$/);
    expect(end).toMatch(/\+05:30$/);
    expect(start <= end).toBe(true);
  });

  it("checks range membership using IST boundaries", () => {
    const { start, end } = getISTTodayRange();
    const noonIst = start.replace("T00:00:00.000+05:30", "T12:00:00.000+05:30");
    expect(isWithinISTRange(noonIst, start, end)).toBe(true);
  });

  it("round-trips datetime-local through IST naive ISO", () => {
    const local = "2026-06-26T14:30";
    const naive = istDatetimeLocalToNaiveIso(local);
    expect(naive).toBe("2026-06-26T14:30:00");
    expect(toISTDatetimeLocalValue(`${naive}+05:30`)).toBe(local);
  });
});
