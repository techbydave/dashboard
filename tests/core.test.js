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

import { renderMarkdown, parseSSE } from "../assets/chat.js";

test("chat markdown is escaped and formatted", () => {
  const html = renderMarkdown("**Hi** <script>x</script>\n- one\n- two\n\n```\na<b\n```");
  assert.ok(html.includes("<strong>Hi</strong>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("<ul><li>one</li><li>two</li></ul>"));
  assert.ok(html.includes("<pre><code>a&lt;b</code></pre>"));
  assert.ok(!renderMarkdown("[x](javascript:alert(1))").includes("<a "));
});

test("chat stream parser collects text deltas across chunks", () => {
  let out = "";
  const ev = (t) => `event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":${JSON.stringify(t)}}}\n\n`;
  const all = ev("Hel") + ev("lo") + "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n";
  let rest = parseSSE(all.slice(0, 50), (t) => (out += t));
  rest = parseSSE(rest + all.slice(50), (t) => (out += t));
  assert.equal(out, "Hello");
  assert.equal(rest, "");
});

import { problems, costNote, hashtagText, fullCaption, withManual } from "../assets/post.js";

test("post page: hashtags are cleaned and de-duplicated", () => {
  assert.equal(hashtagText("#tech, Tech  iphone ##apple bad-tag"), "#tech #iphone #apple #badtag");
  assert.equal(fullCaption({ caption: " Hi ", hashtags: "a" }), "Hi\n\n#a");
  assert.equal(fullCaption({ caption: "", hashtags: "" }), "");
});

test("post page: problems block bad posts", () => {
  const accounts = [{ id: "y", platform: "youtube" }, { id: "t", platform: "tiktok" }, { id: "p", platform: "pinterest" }, { id: "x", platform: "twitter" }];
  const base = { accounts, mediaType: "video" };
  assert.deepEqual(problems({ ...base, mediaType: null, selected: [], fields: {} }), ["Add a photo or video.", "Pick at least one account."]);
  const p = problems({ ...base, selected: ["y", "t", "p", "x"], fields: { x: { caption: "a".repeat(300) } } });
  assert.ok(p.includes("YouTube needs a title."));
  assert.ok(p.includes("Pick a Pinterest board."));
  assert.ok(p.includes("Pick who can see the TikTok post."));
  assert.ok(p.includes("Tick the TikTok consent box."));
  assert.ok(p.some((m) => m.startsWith("X: caption is 20 characters too long")));
  assert.ok(problems({ ...base, mediaType: "image", selected: ["y"], fields: { y: { title: "T" } } }).includes("YouTube only takes videos."));
  assert.deepEqual(problems({ ...base, selected: ["y", "t", "p"], fields: { y: { title: "T" }, t: { privacy: "SELF_ONLY", consent: true }, p: { boardId: "1" } } }), []);
});

test("post page: X cost warning mentions links", () => {
  const accounts = [{ id: "x", platform: "twitter" }, { id: "i", platform: "instagram" }];
  assert.equal(costNote(accounts, ["i"], {}), "");
  assert.match(costNote(accounts, ["x"], { x: { caption: "hi" } }), /0\.015/);
  assert.match(costNote(accounts, ["x"], { x: { caption: "read techbydave.com" } }), /0\.20/);
});

test("post page: no copy-and-paste accounts are added (X and Pinterest removed)", () => {
  const list = withManual([{ id: "t", platform: "tiktok" }, { id: "direct-instagram", platform: "instagram", direct: true }]);
  assert.deepEqual(list.map((a) => a.platform), ["tiktok", "instagram"]);
  assert.ok(problems({ accounts: list, selected: ["direct-instagram"], fields: {}, mediaType: "image", when: "later" })[0].startsWith("Instagram can only post right away"));
  assert.deepEqual(problems({ accounts: list, selected: ["direct-instagram"], fields: {}, mediaType: "image" }), []);
});

import { upcoming, whenLabel } from "../assets/post.js";

test("upcoming keeps only scheduled posts, soonest first", () => {
  const posts = [
    { id: "a", status: "published", scheduledFor: "2026-11-17T10:00:00Z" },
    { id: "b", status: "scheduled", scheduledFor: "2026-11-20T23:00:00Z" },
    { id: "c", status: "scheduled", scheduledFor: "2026-11-18T23:00:00Z" },
    { id: "d", status: "scheduled", scheduledFor: null },
  ];
  assert.deepEqual(upcoming(posts).map((p) => p.id), ["c", "b", "d"]);
  assert.deepEqual(upcoming(undefined), []);
});

test("whenLabel says today, tomorrow or the date", () => {
  const now = new Date(2026, 10, 16, 13, 0);
  assert.match(whenLabel(new Date(2026, 10, 16, 18, 0).toISOString(), now), /^Today, /);
  assert.match(whenLabel(new Date(2026, 10, 17, 9, 30).toISOString(), now), /^Tomorrow, /);
  assert.doesNotMatch(whenLabel(new Date(2026, 10, 20, 18, 0).toISOString(), now), /^(Today|Tomorrow)/);
  assert.equal(whenLabel("nope", now), "No time set");
});

import { placeholders, fillDraft, todoCount, b64ToText, textToB64, photoName } from "../assets/drafts.js";

const DRAFT = `---
title: iPhone 15 Plus Review
date: 2026-11-14
image: [[ADD YOUR PHOTO: filename of your main photo]]
snippet: [[ADD YOUR SNIPPET: one sentence]]
verdict: [[ADD YOUR VERDICT: BUY, WAIT or SKIP]]
---

[[ADD YOUR HOOK: 2-3 sentences.]]

[[ADD YOUR PHOTO: your photo of the phone]]

## My take

[[ADD YOUR TAKE: 2-3 sentences on what you think. Delete this whole line when done.]]
`;

test("placeholders finds each marker with a label and kind", () => {
  const p = placeholders(DRAFT);
  assert.deepEqual(p.map((x) => [x.name, x.kind, x.field]), [
    ["PHOTO", "photo", "image"], ["SNIPPET", "line", "snippet"], ["VERDICT", "verdict", "verdict"],
    ["HOOK", "text", null], ["PHOTO", "photo", null], ["TAKE", "text", null],
  ]);
  assert.equal(p[5].label, "Your take");
  assert.equal(p[5].hint, "2-3 sentences on what you think.");
  assert.equal(todoCount(DRAFT), 6);
});

test("fillDraft writes answers, removes skipped photos and keeps the rest", () => {
  const out = fillDraft(DRAFT, {
    0: { image: "iphone-desk.jpg" },
    1: { text: "Two years in,\nstill great." },
    2: { text: "buy" },
    3: { text: "I've used it daily." },
    4: { remove: true },
  });
  assert.match(out, /^image: iphone-desk\.jpg$/m);
  assert.match(out, /^snippet: Two years in, still great\.$/m);
  assert.match(out, /^verdict: BUY$/m);
  assert.match(out, /I've used it daily\./);
  assert.doesNotMatch(out, /your photo of the phone/);
  assert.equal(todoCount(out), 1); // the take is still left
  const done = fillDraft(out, { 0: { text: "Worth it." } });
  assert.equal(todoCount(done), 0);
  assert.match(done, /## My take\n\nWorth it\.\n$/);
});

test("fillDraft drops a skipped frontmatter photo line and inserts body photos as images", () => {
  const out = fillDraft(DRAFT, { 0: { remove: true }, 4: { image: "a.jpg", alt: "On my [desk]" } });
  assert.doesNotMatch(out, /^image:/m);
  assert.match(out, /!\[On my desk\]\(\.\.\/images\/a\.jpg\)/);
  assert.match(out, /^title: iPhone 15 Plus Review$/m);
});

test("base64 round trip keeps emoji and curly quotes", () => {
  const s = "Worth it? 📱 “Yes” — mostly";
  assert.equal(b64ToText(textToB64(s)), s);
  assert.match(photoName("2026-11-14-iphone-15-plus-review.md"), /^iphone-15-plus-review-[a-z0-9]+\.jpg$/);
});

import { weekStart, goalProgress } from "../assets/goals.js";

test("weekStart is the Monday of the week", () => {
  assert.equal(weekStart("2026-11-16"), "2026-11-16"); // Monday
  assert.equal(weekStart("2026-11-22"), "2026-11-16"); // Sunday
  assert.equal(weekStart("2026-11-15"), "2026-11-09");
});

test("goalProgress counts posts, reviews, subscribers and ticks for this week", () => {
  const today = "2026-11-18";
  const content = [
    { type: "post", day: "2026-11-16", review: true }, { type: "post", day: "2026-11-17" },
    { type: "post", day: "2026-11-10" }, { type: "draft", day: "2026-11-18" },
  ];
  const rows = [
    { day: "2026-11-15", source: "newsletter", metric: "subscribers", value: 40 },
    { day: "2026-11-18", source: "newsletter", metric: "subscribers", value: 47 },
  ];
  assert.equal(goalProgress({ kind: "posts", target: 3 }, { today, content }).done, 2);
  assert.equal(goalProgress({ kind: "reviews", target: 2 }, { today, content }).done, 1);
  const subs = goalProgress({ kind: "subscribers", target: 5 }, { today, rows });
  assert.equal(subs.done, 7); assert.equal(subs.met, true); assert.equal(subs.pct, 1);
  const m = goalProgress({ id: "g", kind: "manual", target: 5 }, { today, ticks: [{ goal_id: "g", week: "2026-11-16", count: 2 }] });
  assert.equal(m.done, 2); assert.equal(m.daysLeft, 4);
  assert.equal(goalProgress({ kind: "subscribers", target: 5 }, { today, rows: [] }).done, null);
});

import { dealAlert, dealTotals, nextStage } from "../assets/deals.js";

test("deal alerts flag overdue, due soon, unpaid and quiet deals", () => {
  const today = "2026-11-16";
  assert.equal(dealAlert({ stage: "creating", due: "2026-11-14" }, today).text, "Overdue by 2 days");
  assert.equal(dealAlert({ stage: "creating", due: "2026-11-16" }, today).text, "Due today");
  assert.equal(dealAlert({ stage: "talking", last_contact: "2026-11-05" }, today).text, "Follow up: quiet 11 days");
  assert.equal(dealAlert({ stage: "talking", last_contact: "2026-11-13" }, today), null);
  assert.equal(dealAlert({ stage: "posted", value: 300 }, today).text, "Waiting on payment");
  assert.equal(dealAlert({ stage: "paid", due: "2026-11-01" }, today), null);
  assert.equal(nextStage("talking"), "agreed"); assert.equal(nextStage("paid"), null);
});

test("deal totals add up open, agreed and paid money", () => {
  const t = dealTotals([
    { stage: "talking", value: 500 }, { stage: "agreed", value: 300 }, { stage: "paid", value: 200, updated_at: "2026-10-01" },
    { stage: "closed", value: 900 },
  ], "2026-11-16");
  assert.deepEqual(t, { active: 2, agreed: 300, paidThisYear: 200, attention: 0 });
});

import { frameTimes, clock } from "../assets/chat.js";

test("frameTimes spreads frames across a video without going past the end", () => {
  const t = frameTimes(42);
  assert.equal(t.length, 12);
  assert.ok(t[0] > 0 && t[0] < 0.5);
  assert.ok(t.at(-1) < 42 && t.at(-1) > 40);
  assert.ok(t.every((x, i) => i === 0 || x > t[i - 1]));
  assert.equal(frameTimes(6).length, 2);
  assert.deepEqual(frameTimes(NaN), [0]);
  assert.equal(clock(75), "1:15");
});

import { sortNotes, snippet } from "../assets/notes.js";

test("notes sort pinned first, then newest, and preview skips headings", () => {
  const out = sortNotes([
    { id: "a", updated_at: "2026-11-10" }, { id: "b", updated_at: "2026-11-15" }, { id: "c", pinned: true, updated_at: "2026-11-01" },
  ]);
  assert.deepEqual(out.map((n) => n.id), ["c", "b", "a"]);
  assert.equal(snippet("# Title\n\n**Day 1:** DM [PITAKA](https://x.y)"), "Day 1: DM PITAKA");
  assert.equal(snippet(""), "");
});

import { WEEKS, PHASES, TOTAL, sessionDate, sessionAt, session, currentSession, streak, missed, phaseProgress } from "../assets/learn-plan.js";

test("learn plan: 35 weeks of five days, phases cover every week", () => {
  assert.equal(WEEKS.length, 35);
  WEEKS.forEach(([title, days]) => { assert.ok(title); assert.equal(days.length, 5); });
  for (let w = 1; w <= 35; w++) assert.equal(PHASES.filter((p) => w >= p.weeks[0] && w <= p.weeks[1]).length, 1, `week ${w}`);
  assert.equal(TOTAL, 175);
});

test("learn plan: dates map to weekdays from Mon Nov 30 2026", () => {
  assert.equal(sessionDate(0), "2026-11-30");
  assert.equal(sessionDate(4), "2026-12-04");
  assert.equal(sessionDate(5), "2026-12-07");
  assert.equal(sessionDate(TOTAL - 1), "2027-07-30");
  assert.equal(sessionAt("2026-12-05"), null); // Saturday
  assert.equal(sessionAt("2026-11-29"), null);
  assert.equal(sessionAt("2026-12-25"), 19);
  assert.equal(session(19).holiday, "Christmas");
  assert.equal(session(60).phase.key, "sql");
  for (let i = 0; i < TOTAL; i++) assert.equal(sessionAt(sessionDate(i)), i);
});

test("learn plan: current session, streak, missed and progress", () => {
  assert.equal(currentSession("2026-11-24"), 0);           // before the start
  assert.equal(currentSession("2026-12-05"), 5);           // Saturday -> next Monday
  assert.equal(currentSession("2027-09-01"), TOTAL - 1);   // after the end
  const done = ["2026-11-30", "2026-12-01", "2026-12-03", "2026-12-04"];
  assert.equal(streak(done, "2026-12-04"), 2);
  assert.equal(streak(done, "2026-12-06"), 2);             // weekend keeps the streak
  assert.equal(streak(done, "2026-12-07"), 2);             // today not ticked yet still counts the run before it
  assert.equal(streak(["2026-12-07", ...done], "2026-12-07"), 3);
  assert.deepEqual(missed(done, "2026-12-07"), [2]);
  assert.deepEqual(phaseProgress(PHASES[0], done), { done: 4, total: 15 });
});
