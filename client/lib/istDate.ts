export const IST_TIMEZONE = "Asia/Kolkata";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function getISTParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: hour === 24 ? 0 : hour,
  };
}

export function formatISTDate(date = new Date()): string {
  const { year, month, day } = getISTParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getISTHour(date: Date): number {
  return getISTParts(date).hour;
}

export function istDateRangeISO(
  year: number,
  month: number,
  day: number,
): { start: string; end: string } {
  const date = `${year}-${pad2(month)}-${pad2(day)}`;
  return {
    start: `${date}T00:00:00.000+05:30`,
    end: `${date}T23:59:59.999+05:30`,
  };
}

export function shiftISTDate(year: number, month: number, day: number, days: number) {
  const anchor = new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00+05:30`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return getISTParts(anchor);
}

export function getISTTodayRange(): { start: string; end: string } {
  const { year, month, day } = getISTParts();
  return istDateRangeISO(year, month, day);
}

export function getISTYesterdayRange(): { start: string; end: string } {
  const { year, month, day } = getISTParts();
  const shifted = shiftISTDate(year, month, day, -1);
  return istDateRangeISO(shifted.year, shifted.month, shifted.day);
}

export function getISTDateRangeFromDaysAgo(daysAgo: number): { start: string; end: string } {
  const today = getISTParts();
  const start = shiftISTDate(today.year, today.month, today.day, -daysAgo);
  return {
    start: istDateRangeISO(start.year, start.month, start.day).start,
    end: istDateRangeISO(today.year, today.month, today.day).end,
  };
}

export function getISTDateRangeFromMonthsAgo(monthsAgo: number): { start: string; end: string } {
  const today = getISTParts();
  const anchor = new Date(`${today.year}-${pad2(today.month)}-${pad2(today.day)}T12:00:00+05:30`);
  anchor.setUTCMonth(anchor.getUTCMonth() - monthsAgo);
  const start = getISTParts(anchor);
  return {
    start: istDateRangeISO(start.year, start.month, start.day).start,
    end: istDateRangeISO(today.year, today.month, today.day).end,
  };
}

export function getISTPreviousRange(spanDays: number): { start: string; end: string } {
  const today = getISTParts();
  const endShifted = shiftISTDate(today.year, today.month, today.day, -spanDays);
  const startShifted = shiftISTDate(
    endShifted.year,
    endShifted.month,
    endShifted.day,
    -(spanDays - 1),
  );
  return {
    start: istDateRangeISO(startShifted.year, startShifted.month, startShifted.day).start,
    end: istDateRangeISO(endShifted.year, endShifted.month, endShifted.day).end,
  };
}

export function isWithinISTRange(
  isoDateStr: string,
  start: string,
  end: string,
): boolean {
  const ts = new Date(isoDateStr).getTime();
  return ts >= new Date(start).getTime() && ts <= new Date(end).getTime();
}

export function formatISTDateTime(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
