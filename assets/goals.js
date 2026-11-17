// Weekly goals: a week runs Monday to Sunday (Toronto). Some goals count themselves from the data the
// dashboard already has; "manual" ones are ticked with +1.

import { addDays } from "./metrics.js";

export const GOAL_KINDS = {
  posts: { label: "Blog posts published", auto: true },
  reviews: { label: "Hands-on reviews published", auto: true },
  subscribers: { label: "New newsletter subscribers", auto: true },
  visits: { label: "Website visits", auto: true },
  manual: { label: "Count it myself (+1 button)", auto: false },
};

export const DEFAULT_GOALS = [
  { title: "Publish 3 blog posts", kind: "posts", target: 3, position: 0 },
  { title: "2 hands-on reviews (for AdSense)", kind: "reviews", target: 2, position: 1 },
  { title: "Post 5 Shorts", kind: "manual", target: 5, position: 2 },
  { title: "+10 newsletter subscribers", kind: "subscribers", target: 10, position: 3 },
];

// Monday of the week holding `day` ("YYYY-MM-DD")
export function weekStart(day) {
  const d = new Date(day + "T12:00:00Z");
  const back = (d.getUTCDay() + 6) % 7;
  return addDays(day, -back);
}

// rows: metrics rows {day, source, metric, value}; content: events from content.js; ticks: {goal_id, week, count}[]
export function goalProgress(goal, { today, rows = [], content = [], ticks = [] }) {
  const from = weekStart(today), to = addDays(from, 6);
  const inWeek = (d) => d >= from && d <= to;
  let done = null;
  if (goal.kind === "posts") done = content.filter((e) => e.type === "post" && inWeek(e.day)).length;
  else if (goal.kind === "reviews") done = content.filter((e) => e.type === "post" && e.review && inWeek(e.day)).length;
  else if (goal.kind === "visits") {
    const v = rows.filter((r) => r.source === "website" && r.metric === "visits" && inWeek(r.day));
    done = v.length ? v.reduce((s, r) => s + Number(r.value || 0), 0) : null;
  } else if (goal.kind === "subscribers") {
    const pts = rows.filter((r) => r.source === "newsletter" && r.metric === "subscribers").sort((a, b) => a.day.localeCompare(b.day));
    const before = pts.filter((r) => r.day < from).pop() ?? pts.find((r) => inWeek(r.day));
    const latest = pts.filter((r) => r.day <= to).pop();
    done = before && latest ? Math.max(0, Number(latest.value) - Number(before.value)) : null;
  } else {
    done = ticks.find((t) => t.goal_id === goal.id && t.week === from)?.count ?? 0;
  }
  const target = Math.max(1, Number(goal.target) || 1);
  return { done, target, pct: done == null ? 0 : Math.min(1, done / target), met: done != null && done >= target, week: from, daysLeft: Math.max(0, 6 - Math.round((Date.parse(today) - Date.parse(from)) / 86400000)) };
}
