import test from "node:test";
import assert from "node:assert/strict";
import { series, dailyFilled, growth, periodCompare, valueOn, compact, signed, monthGrid, addDays, lastEntryDay } from "../assets/metrics.js";
import { frontmatter, toEvent, publishDay } from "../assets/content.js";
import { cloudflareRows } from "../scripts/collect.mjs";

const rows = [
  { day: "2026-11-01", source: "tiktok", metric: "followers", value: 1000 },
  { day: "2026-11-08", source: "tiktok", metric: "followers", value: 1150 },
  { day: "2026-11-09", source: "website", metric: "visits", value: 40 },
  { day: "2026-11-10", source: "website", metric: "visits", value: 60 },
  { day: "2026-11-03", source: "website", metric: "visits", value: 25 },
];

test("series sorts and filters", () => {
  assert.deepEqual(series(rows, "website", "visits").map((p) => p.day), ["2026-11-03", "2026-11-09", "2026-11-10"]);
});

test("daily series fills gaps with zero", () => {
  const d = dailyFilled(rows, "website", "visits", "2026-11-08", "2026-11-10");
  assert.deepEqual(d.map((p) => p.value), [0, 40, 60]);
});

test("follower growth uses the last value before the period", () => {
  assert.deepEqual(growth(rows, "tiktok", "followers", "2026-11-04", "2026-11-10"), { now: 1150, before: 1000, change: 150 });
  assert.equal(valueOn(rows, "tiktok", "followers", "2026-11-05"), 1000);
});

test("visits compare against the previous period of the same length", () => {
  const c = periodCompare(rows, "website", "visits", "2026-11-07", "2026-11-10");
  assert.equal(c.cur, 100); assert.equal(c.prev, 25); assert.equal(c.pct, 3);
});

test("number formatting", () => {
  assert.equal(compact(1234), "1,234"); assert.equal(compact(12345), "12.3K"); assert.equal(compact(2500000), "2.5M");
  assert.equal(signed(150), "+150"); assert.equal(signed(-0.12, true), "−12%"); assert.equal(signed(null), "");
});

test("calendar grid starts on Monday and covers the month", () => {
  const g = monthGrid(2026, 10); // November 2026 starts on a Sunday
  assert.equal(g[0].day, "2026-10-26");
  assert.equal(g.find((d) => d.inMonth).day, "2026-11-01");
  assert.equal(g.length % 7, 0);
  assert.ok(g.some((d) => d.day === "2026-11-30" && d.inMonth));
});

test("date helpers and last entry", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(lastEntryDay(rows, ["tiktok"]), "2026-11-08");
});

test("frontmatter and events from blog files", () => {
  const md = "---\ntitle: Pixel 11 Pro Fold Costs $1,899\ndate: 2026-11-02\nslug: pixel-fold\nverdict: SKIP\npublished: 2026-11-03T00:30:00-05:00\n---\nBody";
  assert.equal(frontmatter(md).title, "Pixel 11 Pro Fold Costs $1,899");
  const post = toEvent("post", { name: "2026-11-02-pixel-fold.md" }, md);
  assert.equal(post.day, "2026-11-03"); assert.equal(post.verdict, "SKIP"); assert.equal(post.url, "https://techbydave.com/posts/pixel-fold.html");
  const draft = toEvent("draft", { name: "2026-11-09-airpods.md" }, "---\ntitle: AirPods\n---\n[[ADD YOUR TAKE: ...]]");
  assert.equal(draft.day, "2026-11-09"); assert.equal(draft.needsTake, true);
  assert.equal(publishDay({ date: "2026-11-06" }), "2026-11-06");
});

test("Cloudflare groups become visit and pageview rows", () => {
  const r = cloudflareRows([{ count: 120, sum: { visits: 80 }, dimensions: { date: "2026-11-09" } }]);
  assert.deepEqual(r, [
    { day: "2026-11-09", source: "website", metric: "pageviews", value: 120 },
    { day: "2026-11-09", source: "website", metric: "visits", value: 80 },
  ]);
});

import { searchDailyRows, searchTopRows } from "../scripts/collect.mjs";
test("Search Console rows", () => {
  const d = searchDailyRows([{ keys: ["2026-11-07"], clicks: 12, impressions: 340, ctr: 0.035, position: 14.234 }]);
  assert.deepEqual(d.map((r) => [r.metric, r.value]), [["clicks", 12], ["impressions", 340], ["position", 14.23]]);
  const t = searchTopRows("query", [{ keys: ["pixel 11 pro fold price"], clicks: 5, impressions: 90, ctr: 0.05555, position: 8.46 }], "2026-11-10");
  assert.deepEqual(t[0], { kind: "query", item: "pixel 11 pro fold price", clicks: 5, impressions: 90, ctr: 0.0556, position: 8.5, period_end: "2026-11-10" });
});

import { pickInstagramToken } from "../scripts/collect.mjs";
import { createHash } from "node:crypto";

test("Instagram uses the renewed token unless the secret was replaced", () => {
  const seed = createHash("sha256").update("orig").digest("hex");
  const stored = { value: "renewed", seed, updated_at: "2026-11-01T00:00:00Z" };
  assert.equal(pickInstagramToken(stored, "orig").token, "renewed");
  assert.equal(pickInstagramToken(stored, "brand-new").token, "brand-new");
  assert.equal(pickInstagramToken(null, "orig").token, "orig");
  assert.equal(pickInstagramToken(null, "orig").renewedAt, null);
});
