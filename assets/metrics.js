// Number crunching shared by the dashboard and its tests. Plain calendar days ("YYYY-MM-DD").

const DAY = 86400000;
export const parseDay = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const isoDay = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => isoDay(new Date(parseDay(s).getTime() + n * DAY));
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / DAY);
export function todayIn(tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// rows: [{day, source, metric, value}] -> sorted [{day, value}] for one source+metric
export function series(rows, source, metric, from = "0000-00-00", to = "9999-99-99") {
  return rows
    .filter((r) => r.source === source && r.metric === metric && r.day >= from && r.day <= to)
    .map((r) => ({ day: r.day.slice(0, 10), value: Number(r.value) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// Daily totals (visits) with missing days filled as 0, so charts don't skip gaps.
export function dailyFilled(rows, source, metric, from, to) {
  const map = new Map(series(rows, source, metric, from, to).map((p) => [p.day, p.value]));
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ day: d, value: map.get(d) ?? 0 });
  return out;
}

export const sum = (pts) => pts.reduce((s, p) => s + p.value, 0);

// For running totals (followers): the latest value on or before a day.
export function valueOn(rows, source, metric, day) {
  const pts = series(rows, source, metric, "0000-00-00", day);
  return pts.length ? pts[pts.length - 1].value : null;
}

// Change over a period for a running total: latest now vs latest at the period start.
export function growth(rows, source, metric, from, to) {
  const now = valueOn(rows, source, metric, to);
  const before = valueOn(rows, source, metric, addDays(from, -1)) ?? series(rows, source, metric, from, to)[0]?.value ?? null;
  return { now, before, change: now != null && before != null ? now - before : null };
}

// Change for a flow (visits): this period's sum vs the previous period of equal length.
export function periodCompare(rows, source, metric, from, to) {
  const len = daysBetween(from, to) + 1;
  const cur = sum(series(rows, source, metric, from, to));
  const prev = sum(series(rows, source, metric, addDays(from, -len), addDays(from, -1)));
  return { cur, prev, pct: prev > 0 ? (cur - prev) / prev : null };
}

export function lastEntryDay(rows, sources) {
  const days = rows.filter((r) => sources.includes(r.source)).map((r) => r.day.slice(0, 10)).sort();
  return days.length ? days[days.length - 1] : null;
}

export function compact(n) {
  if (n == null || isNaN(n)) return "–";
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e4) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString("en-CA");
}

export function signed(n, pct = false) {
  if (n == null || isNaN(n)) return "";
  const v = pct ? `${Math.abs(Math.round(n * 100))}%` : compact(Math.abs(n));
  return n > 0 ? `+${v}` : n < 0 ? `−${v}` : pct ? "0%" : "0";
}

// Month grid for the calendar: Monday-first weeks covering the month.
export function monthGrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - lead * DAY);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getTime() + i * DAY);
    days.push({ day: isoDay(d), inMonth: d.getUTCMonth() === month });
  }
  // drop a trailing week that's entirely next month
  return days.slice(35).every((d) => !d.inMonth) ? days.slice(0, 35) : days;
}
