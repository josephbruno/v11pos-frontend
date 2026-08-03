export const IST_TIMEZONE = "Asia/Kolkata";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const istFormatOptions = { timeZone: IST_TIMEZONE } as const;

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

/** Weekday name in IST, lowercase (e.g. "friday"). */
export function getISTWeekday(date = new Date()): string {
  return date
    .toLocaleDateString("en-US", { timeZone: IST_TIMEZONE, weekday: "long" })
    .toLowerCase();
}

/** Current time in IST as HH:MM (24h). */
export function getISTTimeString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const normalizedHour = hour === "24" ? "00" : hour;
  return `${normalizedHour}:${minute}`;
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
  const ts = toDate(isoDateStr).getTime();
  return ts >= new Date(start).getTime() && ts <= new Date(end).getTime();
}

function toDate(value: string | Date): Date {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return new Date(NaN);

  // MySQL/API often returns naive UTC ("2026-08-03T05:02:57") without Z.
  // Treat those as UTC so IST formatting is correct. Strings with Z or an
  // explicit offset are left to the native Date parser.
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  if (!hasZone && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw)) {
    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    return new Date(`${normalized}Z`);
  }
  return new Date(raw);
}

/** Full date+time in IST, e.g. "26 Jun 2026, 3:45 pm" */
export function formatISTDateTime(date: string | Date): string {
  return toDate(date).toLocaleString("en-IN", {
    ...istFormatOptions,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Date only in IST, e.g. "26 Jun 2026" */
export function formatISTDateOnly(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return toDate(date).toLocaleDateString("en-IN", {
    ...istFormatOptions,
    ...options,
  });
}

/** Short chart label, e.g. "26 Jun" */
export function formatISTDateShort(date: string | Date): string {
  return toDate(date).toLocaleDateString("en-IN", {
    ...istFormatOptions,
    day: "numeric",
    month: "short",
  });
}

/** Long header date, e.g. "Friday, 26 June" */
export function formatISTDateLong(date: string | Date = new Date()): string {
  return toDate(date).toLocaleDateString("en-IN", {
    ...istFormatOptions,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Date+time with explicit fields (orders table style) */
export function formatISTDateTimeCompact(date: string | Date): string {
  return toDate(date).toLocaleString("en-IN", {
    ...istFormatOptions,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Current IST timestamp for exports */
export function formatISTNow(): string {
  return new Date().toLocaleString("en-IN", istFormatOptions);
}

/** `datetime-local` input value from an ISO/API timestamp (IST). */
export function toISTDatetimeLocalValue(value?: string | null): string {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Parse `datetime-local` as IST and return naive local ISO for API (no Z suffix). */
export function istDatetimeLocalToNaiveIso(value?: string): string | undefined {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const date = new Date(`${normalized}+05:30`);
  if (Number.isNaN(date.getTime())) return undefined;
  const { year, month, day, hour } = getISTParts(date);
  const minuteParts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const minute = minuteParts.find((p) => p.type === "minute")?.value ?? "00";
  const second = minuteParts.find((p) => p.type === "second")?.value ?? "00";
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(Number(hour))}:${minute}:${second}`;
}
