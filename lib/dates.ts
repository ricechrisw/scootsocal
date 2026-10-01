import { TZ } from "./constants";

export function todayInLA(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function timeHmInLA(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Invalid date");
  return { y, m, d };
}

export function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(ymd: string, days: number): string {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function compareYmd(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function inclusiveDays(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Math.round((b - a) / 86400000) + 1;
}

export function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (compareYmd(cur, end) <= 0) {
    out.push(cur);
    cur = addDays(cur, 1);
    if (out.length > 366) break;
  }
  return out;
}

export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function weekStartSunday(ymd: string): string {
  const { y, m, d } = parseYmd(ymd);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(ymd, -dow);
}

export function weekEndSaturday(ymd: string): string {
  return addDays(weekStartSunday(ymd), 6);
}

export function startOfMonth(ymd: string): string {
  const { y, m } = parseYmd(ymd);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonth(ymd: string): string {
  const { y, m } = parseYmd(ymd);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function addMonths(ymd: string, months: number): string {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  const y2 = dt.getUTCFullYear();
  const m2 = dt.getUTCMonth() + 1;
  const last = new Date(Date.UTC(y2, m2, 0)).getUTCDate();
  return `${y2}-${String(m2).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function paddedMonthDays(ymd: string): string[] {
  return eachDate(weekStartSunday(startOfMonth(ymd)), weekEndSaturday(endOfMonth(ymd)));
}

export function formatMonthYear(ymd: string): string {
  const { y, m } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(ymd: string): string {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatLong(ymd: string): string {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
