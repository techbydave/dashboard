// Brand deals: who you're talking to, what's agreed, what's due and what's been paid.

import { daysBetween } from "./metrics.js";

export const DEAL_STAGES = [
  ["talking", "Talking"], ["agreed", "Agreed"], ["shipped", "Product on the way"],
  ["creating", "Making content"], ["posted", "Posted"], ["paid", "Paid"],
];
export const CLOSED = "closed";
export const DEAL_KINDS = [["review", "Free product to review"], ["paid", "Paid post"], ["sponsor", "Sponsorship"], ["affiliate", "Affiliate"], ["other", "Other"]];
export const FOLLOW_UP_DAYS = 7;

const OPEN_FOR_FOLLOW_UP = new Set(["talking", "agreed", "shipped"]);
const DONE = new Set(["posted", "paid", CLOSED]);

export function nextStage(stage) {
  const i = DEAL_STAGES.findIndex(([k]) => k === stage);
  return i >= 0 && i < DEAL_STAGES.length - 1 ? DEAL_STAGES[i + 1][0] : null;
}

// What needs attention on a deal today: { level: "late" | "soon" | "quiet", text } or null
export function dealAlert(d, today) {
  if (d.stage === CLOSED || d.stage === "paid") return null;
  if (d.due && !DONE.has(d.stage)) {
    const left = daysBetween(today, d.due);
    if (left < 0) return { level: "late", text: `Overdue by ${-left} day${left === -1 ? "" : "s"}` };
    if (left <= 3) return { level: "soon", text: left === 0 ? "Due today" : `Due in ${left} day${left === 1 ? "" : "s"}` };
  }
  if (d.stage === "posted" && Number(d.value) > 0) return { level: "soon", text: "Waiting on payment" };
  if (OPEN_FOR_FOLLOW_UP.has(d.stage) && d.last_contact) {
    const quiet = daysBetween(d.last_contact, today);
    if (quiet >= FOLLOW_UP_DAYS) return { level: "quiet", text: `Follow up: quiet ${quiet} days` };
  }
  return null;
}

// Totals for the summary strip
export function dealTotals(deals, today) {
  const year = today.slice(0, 4);
  const open = deals.filter((d) => d.stage !== CLOSED && d.stage !== "paid");
  return {
    active: open.length,
    agreed: open.filter((d) => d.stage !== "talking").reduce((s, d) => s + (Number(d.value) || 0), 0),
    paidThisYear: deals.filter((d) => d.stage === "paid" && String(d.updated_at || d.created_at || today).slice(0, 4) === year)
      .reduce((s, d) => s + (Number(d.value) || 0), 0),
    attention: deals.filter((d) => dealAlert(d, today)).length,
  };
}

export const money = (n) => (Number(n) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
