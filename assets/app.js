// TechByDave Dashboard
//   Live: config.js has Supabase settings -> email + password sign-in, your real numbers.
//   Demo: no settings yet (or ?demo) -> sample numbers, clearly labelled.

import { series, dailyFilled, growth, periodCompare, lastEntryDay, compact, signed, monthGrid, addDays, daysBetween, todayIn, sum } from "./metrics.js";
import { areaChart, sparkline, tableHTML } from "./charts.js";
import { loadContent } from "./content.js";
import { demoRows, demoIdeas, demoContent, demoSearchTop } from "./demo.js";

const TZ = "America/Toronto";
const cfg = window.DASH_CONFIG || {};
const FORCE_DEMO = new URLSearchParams(location.search).has("demo");
const CONFIGURED = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (day, o) => new Date(day + "T00:00:00Z").toLocaleDateString("en-CA", { timeZone: "UTC", ...o });
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

const PLATFORMS = [
  { id: "tiktok", name: "TikTok", mono: "TT", manual: true, metric: "followers", unit: "followers" },
  { id: "instagram", name: "Instagram", mono: "IG", manual: true, metric: "followers", unit: "followers" },
  { id: "youtube", name: "YouTube", mono: "YT", manual: false, metric: "followers", unit: "subscribers" },
  { id: "pinterest", name: "Pinterest", mono: "PI", manual: true, metric: "followers", unit: "followers" },
  { id: "newsletter", name: "Newsletter", mono: "NL", manual: false, metric: "subscribers", unit: "subscribers" },
];
const STAGES = [["idea", "Ideas"], ["planned", "Planned"], ["filming", "Making it"], ["posted", "Posted"]];

// ---------------------------------------------------------------------------
// Data stores
// ---------------------------------------------------------------------------
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

class DemoStore {
  demo = true;
  constructor() { this.today = todayIn(TZ); }
  async session() { return { email: "demo@techbydave.com" }; }
  async isAdmin() { return true; }
  async signOut() {}
  async metrics() {
    const extra = lsGet("tbd-demo-checkins", []);
    const map = new Map(demoRows(this.today).map((r) => [`${r.day}|${r.source}|${r.metric}`, r]));
    for (const r of extra) map.set(`${r.day}|${r.source}|${r.metric}`, r);
    return [...map.values()];
  }
  async saveMetrics(rows) { lsSet("tbd-demo-checkins", [...lsGet("tbd-demo-checkins", []), ...rows]); }
  async ideas() { const v = lsGet("tbd-demo-ideas", null); if (v) return v; const s = demoIdeas(this.today); lsSet("tbd-demo-ideas", s); return s; }
  async saveIdea(idea) { const all = await this.ideas(); const i = all.findIndex((x) => x.id === idea.id); if (i >= 0) all[i] = idea; else all.push(idea); lsSet("tbd-demo-ideas", all); return idea; }
  async deleteIdea(id) { lsSet("tbd-demo-ideas", (await this.ideas()).filter((x) => x.id !== id)); }
  async searchTop() { return demoSearchTop(this.today); }
}

class LiveStore {
  demo = false;
  async init() {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
    this.db = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    this.db.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") showReset(); });
  }
  async session() { const { data } = await this.db.auth.getSession(); return data.session?.user || null; }
  async signIn(email, password) { const { error } = await this.db.auth.signInWithPassword({ email, password }); if (error) throw error; }
  async resetPassword(email) { const { error } = await this.db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw error; }
  async updatePassword(password) { const { error } = await this.db.auth.updateUser({ password }); if (error) throw error; }
  async isAdmin() { const { data, error } = await this.db.rpc("is_admin"); if (error) throw error; return data === true; }
  async signOut() { await this.db.auth.signOut(); }
  async metrics(from) {
    const out = [];
    for (let i = 0; ; i += 1000) {
      const { data, error } = await this.db.from("metrics").select("day,source,metric,value").gte("day", from).order("day").range(i, i + 999);
      if (error) throw error;
      out.push(...data);
      if (data.length < 1000) return out;
    }
  }
  async saveMetrics(rows) { const { error } = await this.db.from("metrics").upsert(rows); if (error) throw error; }
  async ideas() { const { data, error } = await this.db.from("ideas").select("*").order("created_at"); if (error) throw error; return data; }
  async saveIdea(idea) { const { data, error } = await this.db.from("ideas").upsert(idea).select().single(); if (error) throw error; return data; }
  async deleteIdea(id) { const { error } = await this.db.from("ideas").delete().eq("id", id); if (error) throw error; }
  async searchTop() {
    const { data, error } = await this.db.from("search_top").select("*").order("clicks", { ascending: false }).order("impressions", { ascending: false });
    if (error) { console.warn("search_top:", error.message); return []; } // table not created yet
    return data;
  }
}

let store = null;
const state = { view: "overview", days: lsGet("tbd-range", 30), rows: [], ideas: [], content: [], contentNote: "", searchTop: [], cal: null, user: null };

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}
function greeting() { const h = new Date().getHours(); return h < 5 ? "Up late, Dave?" : h < 12 ? "Good morning, Dave" : h < 18 ? "Good afternoon, Dave" : "Good evening, Dave"; }
function deltaChip(v, { pct = false, suffix = "" } = {}) {
  if (v == null || isNaN(v)) return `<span class="delta flat">No change data</span>`;
  const dir = v > 0 ? "up" : v < 0 ? "down" : "flat";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
  return `<span class="delta ${dir}"><i aria-hidden="true">${arrow}</i>${signed(v, pct)}${suffix}</span>`;
}
function relDay(day, today) {
  const n = daysBetween(today, day);
  if (n === 0) return "Today"; if (n === 1) return "Tomorrow"; if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return fmt(day, { weekday: "long" });
  return fmt(day, { month: "short", day: "numeric" });
}

// Daily running value (e.g. followers) across a range, carrying the last known value forward.
function runningDaily(pts, from, to) {
  const out = []; let j = 0, last = null;
  while (j < pts.length && pts[j].day < from) last = pts[j++].value;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    while (j < pts.length && pts[j].day <= d) last = pts[j++].value;
    out.push({ day: d, value: last });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function range() { const to = todayIn(TZ); return { from: addDays(to, -(state.days - 1)), to }; }

function renderOverview() {
  const { from, to } = range();
  const rows = state.rows;

  // Audience: every platform's latest followers/subscribers added up
  const per = PLATFORMS.map((p) => {
    const pts = series(rows, p.id, p.metric);
    return { p, pts, g: growth(rows, p.id, p.metric, from, to), daily: runningDaily(pts, from, to) };
  });
  const have = per.filter((x) => x.g.now != null);
  const audience = sum(have.map((x) => ({ value: x.g.now })));
  const audienceChange = have.every((x) => x.g.change != null) ? sum(have.map((x) => ({ value: x.g.change }))) : null;
  const audienceDaily = per[0].daily.map((d, i) => ({ day: d.day, value: sum(per.map((x) => ({ value: x.daily[i].value ?? 0 }))) }));

  const visits = periodCompare(rows, "website", "visits", from, to);
  const visitsDaily = dailyFilled(rows, "website", "visits", from, to);
  const news = per.find((x) => x.p.id === "newsletter");
  const posts = state.content.filter((e) => e.type === "post");
  const postsNow = posts.filter((e) => e.day >= from && e.day <= to).length;
  const postsPrev = posts.filter((e) => e.day >= addDays(from, -state.days) && e.day < from).length;
  const draftsWaiting = state.content.filter((e) => e.type === "draft").length;

  const tiles = [
    { label: "Total audience", value: have.length ? compact(audience) : "–", delta: deltaChip(audienceChange), sub: `across ${have.length} of ${PLATFORMS.length} channels`, spark: audienceDaily.filter((d) => d.value) },
    { label: "Website visits", value: compact(visits.cur), delta: deltaChip(visits.pct, { pct: true }), sub: `vs previous ${state.days} days`, spark: visitsDaily },
    { label: "Newsletter", value: news.g.now != null ? compact(news.g.now) : "–", delta: deltaChip(news.g.change), sub: "active subscribers", spark: news.daily.filter((d) => d.value != null) },
    { label: "Posts published", value: String(postsNow), delta: deltaChip(postsNow - postsPrev), sub: `${draftsWaiting} draft${draftsWaiting === 1 ? "" : "s"} waiting`, spark: [] },
  ];
  $("#kpis").innerHTML = tiles.map((t, i) => `
    <article class="kpi" style="--i:${i}">
      <div class="kpi-top"><span class="kpi-label">${t.label}</span>${t.delta}</div>
      <div class="kpi-num">${t.value}</div>
      <div class="kpi-foot"><span class="muted small">${t.sub}</span>${t.spark.length > 1 ? sparkline(t.spark, { w: 104, h: 30 }) : ""}</div>
    </article>`).join("");

  renderUpNext(to);
  renderBanner(to);

  // Traffic chart
  const pv = sum(series(rows, "website", "pageviews", from, to));
  $("#traffic-total").textContent = compact(visits.cur);
  $("#traffic-sub").textContent = visits.cur
    ? `${compact(pv)} page views · ${compact(visits.cur / state.days)} visits a day on average`
    : "No website numbers yet. Add your Cloudflare key (see the README).";
  areaChart($("#traffic-chart"), visitsDaily, { label: "Website visits per day" });
  $("#traffic-table").innerHTML = tableHTML(visitsDaily, "Visits");

  // Platforms
  $("#platforms-sub").textContent = `Change over the last ${state.days} days`;
  $("#platforms").innerHTML = per.map(({ p, pts, g }, i) => {
    const inRange = pts.filter((d) => d.day >= addDays(from, -7) && d.day <= to);
    const last = pts[pts.length - 1];
    const how = p.manual ? "weekly check-in" : "automatic";
    return `<article class="plat" style="--i:${i}">
      <header><span class="mono" aria-hidden="true">${p.mono}</span><div><h3>${p.name}</h3><span class="muted small">${how}</span></div>${g.now != null ? deltaChip(g.change) : ""}</header>
      ${g.now != null
        ? `<div class="plat-num">${compact(g.now)}<span>${p.unit}</span></div>${sparkline(inRange, { w: 220, h: 44 })}
           <p class="muted small">Updated ${relDay(last.day, to).toLowerCase() === "today" ? "today" : fmt(last.day, { month: "short", day: "numeric" })}</p>`
        : `<div class="plat-empty">${p.manual ? `<button class="btn ghost sm" data-open="checkin">Add your first numbers</button>` : `<span class="muted small">Connects automatically once its key is added (see the README).</span>`}</div>`}
    </article>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Google Search (Search Console)
// ---------------------------------------------------------------------------
function renderSearch() {
  const { from, to } = range();
  const rows = state.rows;
  const has = rows.some((r) => r.source === "search");
  $("#search-empty").hidden = has;
  $("#search-body").hidden = !has;
  if (!has) {
    $("#search-empty").innerHTML = `<article class="panel search-empty">
      <h2>Connect Google Search Console</h2>
      <p class="muted">See which Google searches bring people to techbydave.com, how often your posts show up, and where they rank. It takes about 10 minutes, once.</p>
      <ol>
        <li>In Google Cloud, create a service account and download its JSON key.</li>
        <li>Turn on the <b>Google Search Console API</b> for that project.</li>
        <li>In Search Console → Settings → Users and permissions, add the service account's email (Restricted is enough).</li>
        <li>In the dashboard repo on GitHub, add the whole JSON file as the secret <code>GSC_SERVICE_ACCOUNT</code>.</li>
      </ol>
      <p class="muted small">The full steps are in the README. Numbers appear after the next automatic update (about 6am and 6pm).</p>
    </article>`;
    return;
  }
  // Google is ~2 days behind; compare like with like by shifting the window to the last day with data.
  const last = series(rows, "search", "clicks").at(-1)?.day || to;
  const end = last < to ? last : to, start = addDays(end, -(state.days - 1));
  const clicks = periodCompare(rows, "search", "clicks", start, end);
  const impr = periodCompare(rows, "search", "impressions", start, end);
  const pStart = addDays(start, -state.days), pEnd = addDays(start, -1);
  const ctr = impr.cur ? clicks.cur / impr.cur : null;
  const ctrPrev = impr.prev ? clicks.prev / impr.prev : null;
  const avgPos = (a, b) => { // impression-weighted average position
    const pos = series(rows, "search", "position", a, b), im = new Map(series(rows, "search", "impressions", a, b).map((d) => [d.day, d.value]));
    let w = 0, t = 0; for (const p of pos) { const k = im.get(p.day) || 0; w += k; t += p.value * k; }
    return w ? t / w : null;
  };
  const pos = avgPos(start, end), posPrev = avgPos(pStart, pEnd);
  const clicksDaily = dailyFilled(rows, "search", "clicks", start, end);
  const imprDaily = dailyFilled(rows, "search", "impressions", start, end);
  const posChange = pos != null && posPrev != null ? posPrev - pos : null; // positive = moved up the results
  const tiles = [
    { label: "Clicks", value: compact(clicks.cur), delta: deltaChip(clicks.pct, { pct: true }), sub: `vs previous ${state.days} days`, spark: clicksDaily },
    { label: "Impressions", value: compact(impr.cur), delta: deltaChip(impr.pct, { pct: true }), sub: "times you appeared in results", spark: imprDaily },
    { label: "Click-through rate", value: ctr != null ? (ctr * 100).toFixed(1) + "%" : "–", delta: deltaChip(ctr != null && ctrPrev != null ? Math.round((ctr - ctrPrev) * 1000) / 10 : null, { suffix: " pts" }), sub: "of people who saw you, clicked", spark: [] },
    { label: "Average position", value: pos != null ? pos.toFixed(1) : "–", delta: deltaChip(posChange != null ? Math.round(posChange * 10) / 10 : null, { suffix: posChange != null ? " spots" : "" }), sub: "lower is better · 1 is the top result", spark: [] },
  ];
  $("#search-kpis").innerHTML = tiles.map((t, i) => `
    <article class="kpi" style="--i:${i}">
      <div class="kpi-top"><span class="kpi-label">${t.label}</span>${t.delta}</div>
      <div class="kpi-num">${t.value}</div>
      <div class="kpi-foot"><span class="muted small">${t.sub}</span>${t.spark.length > 1 ? sparkline(t.spark, { w: 104, h: 30 }) : ""}</div>
    </article>`).join("");
  $("#clicks-total").textContent = compact(clicks.cur);
  $("#impr-total").textContent = compact(impr.cur);
  areaChart($("#clicks-chart"), clicksDaily, { label: "Clicks from Google per day" });
  areaChart($("#impr-chart"), imprDaily, { label: "Google impressions per day" });
  $("#clicks-table").innerHTML = tableHTML(clicksDaily, "Clicks");
  $("#impr-table").innerHTML = tableHTML(imprDaily, "Impressions");

  const top = state.searchTop;
  const period = top[0]?.period_end ? `Last 30 days to ${fmt(top[0].period_end, { month: "short", day: "numeric" })}` : "Last 30 days";
  $("#queries-sub").textContent = period; $("#pages-sub").textContent = period;
  const label = (kind, item) => kind === "page"
    ? `<a href="${esc(item)}" target="_blank" rel="noopener" title="${esc(item)}">${esc(item.replace(/^https?:\/\/[^/]+/, "") || "/")}</a>`
    : `<span title="${esc(item)}">${esc(item)}</span>`;
  const table = (kind, head) => {
    const list = top.filter((t) => t.kind === kind);
    if (!list.length) return `<p class="muted small">Nothing yet. Google needs a few searches before it lists them.</p>`;
    return `<table class="data-table rank-table"><thead><tr><th>${head}</th><th>Clicks</th><th>Shown</th><th>Position</th></tr></thead><tbody>${
      list.map((t) => `<tr><td>${label(kind, t.item)}</td><td>${compact(Number(t.clicks))}</td><td>${compact(Number(t.impressions))}</td><td>${Number(t.position).toFixed(1)}</td></tr>`).join("")}</tbody></table>`;
  };
  $("#top-queries").innerHTML = table("query", "Search");
  $("#top-pages").innerHTML = table("page", "Page");
}

function renderUpNext(today) {
  const soon = state.ideas.filter((i) => i.due && i.status !== "posted" && i.due >= today && i.due <= addDays(today, 14)).sort((a, b) => a.due.localeCompare(b.due));
  const overdue = state.ideas.filter((i) => i.due && i.status !== "posted" && i.due < today);
  const drafts = state.content.filter((e) => e.type === "draft").sort((a, b) => b.day.localeCompare(a.day));
  const items = [
    ...overdue.map((i) => `<button class="up-item warn" data-idea="${esc(i.id)}"><span class="when">Overdue</span><b>${esc(i.title)}</b><span class="tag">${esc(i.platform || "")}</span></button>`),
    ...soon.slice(0, 3).map((i) => `<button class="up-item" data-idea="${esc(i.id)}"><span class="when">${relDay(i.due, today)}</span><b>${esc(i.title)}</b><span class="tag">${esc(i.platform || "")}</span></button>`),
    ...drafts.slice(0, 3).map((d) => `<a class="up-item" href="${esc(d.url)}" target="_blank" rel="noopener"><span class="when">Draft</span><b>${esc(d.title)}</b><span class="tag ${d.needsTake ? "attn" : ""}">${d.needsTake ? "Needs your take" : "Ready to publish"}</span></a>`),
  ];
  $("#upnext").innerHTML = items.length ? items.join("") : `<div class="empty-mini"><b>All caught up.</b><span class="muted">Nothing due in the next two weeks.</span><button class="btn ghost sm" data-new-idea>Add an idea</button></div>`;
  if (state.contentNote) $("#upnext").insertAdjacentHTML("beforeend", `<p class="muted small note">${esc(state.contentNote)}</p>`);
}

function renderBanner(today) {
  const last = lastEntryDay(state.rows, PLATFORMS.filter((p) => p.manual).map((p) => p.id));
  const age = last ? daysBetween(last, today) : null;
  $("#banner").innerHTML = age == null || age >= 7
    ? `<div class="banner"><div><b>Weekly check-in due.</b> <span>${age == null ? "Add your TikTok, Instagram and Pinterest numbers to start tracking them." : `Last one was ${age} days ago.`}</span></div><button class="btn primary sm" data-open="checkin">Do it now</button></div>`
    : "";
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
function eventsByDay() {
  const map = new Map();
  const add = (e) => { if (!map.has(e.day)) map.set(e.day, []); map.get(e.day).push(e); };
  state.content.forEach(add);
  state.ideas.filter((i) => i.due).forEach((i) => add({ type: "idea", id: i.id, day: i.due, title: i.title, platform: i.platform, status: i.status }));
  const order = { post: 0, draft: 1, idea: 2 };
  for (const list of map.values()) list.sort((a, b) => order[a.type] - order[b.type]);
  return map;
}
const TYPE_LABEL = { post: "Post", draft: "Draft", idea: "Idea" };
const TYPE_MARK = { post: "✓", draft: "✎", idea: "✦" };

function renderCalendar() {
  const today = todayIn(TZ);
  if (!state.cal) { const [y, m] = today.split("-").map(Number); state.cal = { y, m: m - 1 }; }
  const { y, m } = state.cal;
  $("#cal-month").textContent = new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-CA", { timeZone: "UTC", month: "long", year: "numeric" });
  const map = eventsByDay();
  $("#cal-grid").innerHTML = monthGrid(y, m).map(({ day, inMonth }) => {
    const list = map.get(day) || [];
    const shown = list.slice(0, 3);
    return `<div class="cell${inMonth ? "" : " out"}${day === today ? " today" : ""}${day < today ? " past" : ""}" data-day="${day}" tabindex="0" role="button" aria-label="${fmt(day, { weekday: "long", month: "long", day: "numeric" })}, ${list.length} item${list.length === 1 ? "" : "s"}">
      <span class="num">${Number(day.slice(8))}</span>
      <div class="chips">${shown.map((e) => `<span class="chip ${e.type}" title="${TYPE_LABEL[e.type]}: ${esc(e.title)}"><em aria-label="${TYPE_LABEL[e.type]}:">${TYPE_MARK[e.type]}</em>${esc(e.title)}</span>`).join("")}
      ${list.length > 3 ? `<span class="more">+${list.length - 3} more</span>` : ""}</div>
      <div class="dots" aria-hidden="true">${list.slice(0, 4).map((e) => `<i class="${e.type}">${TYPE_MARK[e.type]}</i>`).join("")}</div>
    </div>`;
  }).join("");

  const unscheduled = state.ideas.filter((i) => !i.due && i.status !== "posted");
  $("#unscheduled").innerHTML = unscheduled.length
    ? unscheduled.map((i) => `<button class="idea-pill" draggable="true" data-drag="${esc(i.id)}" data-idea="${esc(i.id)}"><span class="grip" aria-hidden="true">⋮⋮</span><span>${esc(i.title)}</span><span class="tag">${esc(i.platform || "")}</span></button>`).join("")
    : `<p class="muted small">Every idea has a date. Nice planning.</p>`;
  const drafts = state.content.filter((e) => e.type === "draft").sort((a, b) => b.day.localeCompare(a.day));
  $("#drafts-list").innerHTML = drafts.length
    ? drafts.map((d) => `<a class="draft-row" href="${esc(d.url)}" target="_blank" rel="noopener"><b>${esc(d.title)}</b><span class="muted small">${fmt(d.day, { month: "short", day: "numeric" })} · <span class="${d.needsTake ? "attn-text" : ""}">${d.needsTake ? "Needs your take" : d.verdict ? `Verdict: ${esc(d.verdict)}` : "Ready"}</span></span></a>`).join("")
    : `<p class="muted small">No drafts waiting.</p>`;
}

function openDay(day) {
  const list = eventsByDay().get(day) || [];
  $("#day-title").textContent = fmt(day, { weekday: "long", month: "long", day: "numeric" });
  $("#day-items").innerHTML = list.length ? list.map((e) => {
    if (e.type === "post") return `<div class="day-item post"><span class="chip-tag post">Post</span><div><b>${esc(e.title)}</b>${e.verdict ? `<span class="muted small">Verdict: ${esc(e.verdict)}</span>` : ""}</div>
      <div class="day-actions"><a class="btn ghost sm" href="${esc(e.url)}" target="_blank" rel="noopener">Read</a><button class="btn ghost sm" data-short="${esc(e.title)}">Make it a Short</button></div></div>`;
    if (e.type === "draft") return `<div class="day-item draft"><span class="chip-tag draft">Draft</span><div><b>${esc(e.title)}</b><span class="muted small">${e.needsTake ? "Needs your take before it can go live" : "Ready to publish"}</span></div>
      <div class="day-actions"><a class="btn ghost sm" href="${esc(e.url)}" target="_blank" rel="noopener">Finish on GitHub</a></div></div>`;
    return `<div class="day-item idea"><span class="chip-tag idea">Idea</span><div><b>${esc(e.title)}</b><span class="muted small">${esc(e.platform || "")} · ${STAGES.find((s) => s[0] === e.status)?.[1] || ""}</span></div>
      <div class="day-actions"><button class="btn ghost sm" data-idea="${esc(e.id)}">Edit</button></div></div>`;
  }).join("") : `<p class="muted">Nothing planned yet.</p>`;
  $("#day-add").onclick = () => { $("#day-dialog").close(); openIdea(null, { due: day, status: "planned" }); };
  $("#day-dialog").showModal();
}

// ---------------------------------------------------------------------------
// Ideas board
// ---------------------------------------------------------------------------
function renderBoard() {
  const today = todayIn(TZ);
  $("#board").innerHTML = STAGES.map(([key, label]) => {
    const list = state.ideas.filter((i) => i.status === key).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    return `<section class="col" data-stage="${key}">
      <header><h2>${label}</h2><span class="count">${list.length}</span></header>
      <div class="col-body">
        ${list.map((i) => `<button class="card" draggable="true" data-drag="${esc(i.id)}" data-idea="${esc(i.id)}">
          <span class="tag">${esc(i.platform || "Idea")}</span>
          <b>${esc(i.title)}</b>
          ${i.notes ? `<span class="muted small clamp">${esc(i.notes)}</span>` : ""}
          ${i.due ? `<span class="due${i.due < today && key !== "posted" ? " late" : ""}">${relDay(i.due, today)}</span>` : ""}
        </button>`).join("")}
        <button class="add-card" data-new-idea data-stage-new="${key}">+ Add</button>
      </div>
    </section>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Dialogs: idea + check-in
// ---------------------------------------------------------------------------
let editingIdea = null;
function openIdea(idea, preset = {}) {
  editingIdea = idea;
  const v = { title: "", platform: "TikTok", status: "idea", due: "", notes: "", ...(idea || {}), ...preset };
  $("#idea-title").textContent = idea ? "Edit idea" : "New idea";
  $("#i-title").value = v.title; $("#i-platform").value = v.platform || "Blog"; $("#i-status").value = v.status;
  $("#i-due").value = v.due || ""; $("#i-notes").value = v.notes || "";
  $("#idea-delete").hidden = !idea; $("#idea-delete").textContent = "Delete"; delete $("#idea-delete").dataset.armed;
  $("#idea-msg").textContent = "";
  $("#idea-dialog").showModal();
  if (!idea) $("#i-title").focus();
}

async function saveIdea(patch, quiet) {
  const idea = await store.saveIdea(patch);
  const i = state.ideas.findIndex((x) => x.id === idea.id);
  if (i >= 0) state.ideas[i] = idea; else state.ideas.push(idea);
  renderAll();
  if (!quiet) toast("Idea saved");
}

$("#idea-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("#i-title").value.trim();
  if (!title) { $("#idea-msg").textContent = "Give the idea a name."; return $("#i-title").focus(); }
  const patch = { ...(editingIdea || { id: uid() }), title, platform: $("#i-platform").value, status: $("#i-status").value, due: $("#i-due").value || null, notes: $("#i-notes").value.trim() || null };
  try { await saveIdea(patch); $("#idea-dialog").close(); } catch (ex) { $("#idea-msg").textContent = ex.message; }
});
$("#idea-delete").addEventListener("click", async (e) => {
  const b = e.currentTarget;
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Tap again to delete"; return; }
  try {
    await store.deleteIdea(editingIdea.id);
    state.ideas = state.ideas.filter((x) => x.id !== editingIdea.id);
    $("#idea-dialog").close(); renderAll(); toast("Idea deleted");
  } catch (ex) { $("#idea-msg").textContent = ex.message; }
});

function openCheckin() {
  const today = todayIn(TZ);
  const fields = PLATFORMS.filter((p) => p.manual || !series(state.rows, p.id, p.metric, addDays(today, -3), today).length);
  $("#checkin-fields").innerHTML = fields.map((p) => {
    const pts = series(state.rows, p.id, p.metric);
    const last = pts[pts.length - 1];
    return `<label class="ci" for="ci-${p.id}"><span class="mono" aria-hidden="true">${p.mono}</span>
      <span class="ci-name">${p.name}<span class="muted small">${last ? `Last: ${compact(last.value)} on ${fmt(last.day, { month: "short", day: "numeric" })}` : "No numbers yet"}</span></span>
      <input id="ci-${p.id}" data-src="${p.id}" data-metric="${p.metric}" type="number" inputmode="numeric" min="0" step="1" placeholder="${p.unit}"></label>`;
  }).join("");
  const auto = PLATFORMS.filter((p) => !fields.includes(p)).map((p) => p.name);
  $("#checkin-auto").textContent = auto.length ? `${auto.join(" and ")} update automatically.` : "";
  $("#checkin-msg").textContent = "";
  $("#checkin").showModal();
  $("#checkin-fields input")?.focus();
}

$("#checkin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const day = todayIn(TZ);
  const rows = [];
  for (const inp of $("#checkin-fields").querySelectorAll("input")) {
    if (inp.value === "") continue;
    const v = Number(inp.value);
    if (!Number.isFinite(v) || v < 0) { $("#checkin-msg").textContent = "Numbers only, please (no commas or letters)."; return inp.focus(); }
    rows.push({ day, source: inp.dataset.src, metric: inp.dataset.metric, value: Math.round(v) });
  }
  if (!rows.length) { $("#checkin-msg").textContent = "Add at least one number."; return; }
  try {
    await store.saveMetrics(rows);
    const keys = new Set(rows.map((r) => `${r.day}|${r.source}|${r.metric}`));
    state.rows = [...state.rows.filter((r) => !keys.has(`${r.day}|${r.source}|${r.metric}`)), ...rows];
    $("#checkin").close(); renderAll(); toast("Numbers saved. See you next week!");
  } catch (ex) { $("#checkin-msg").textContent = ex.message; }
});

for (const d of document.querySelectorAll("dialog")) d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });

// ---------------------------------------------------------------------------
// Global clicks, drag and drop, navigation
// ---------------------------------------------------------------------------
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.closest("[data-open=checkin]")) return openCheckin();
  const ni = t.closest("[data-new-idea]");
  if (ni) return openIdea(null, ni.dataset.stageNew ? { status: ni.dataset.stageNew } : {});
  const ib = t.closest("[data-idea]");
  if (ib) { $("#day-dialog").open && $("#day-dialog").close(); return openIdea(state.ideas.find((x) => x.id === ib.dataset.idea)); }
  const sh = t.closest("[data-short]");
  if (sh) {
    $("#day-dialog").close();
    await saveIdea({ id: uid(), title: `Short: ${sh.dataset.short}`, platform: "TikTok", status: "idea", due: null, notes: "Turn the verdict into a 30-second worth it or waste video." }, true);
    return toast("Added to your ideas board");
  }
  const cell = t.closest(".cell[data-day]");
  if (cell) return openDay(cell.dataset.day);
});
document.addEventListener("keydown", (e) => {
  const cell = e.target.closest?.(".cell[data-day]");
  if (cell && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDay(cell.dataset.day); }
});

let dragId = null;
document.addEventListener("dragstart", (e) => {
  const el = e.target.closest?.("[data-drag]"); if (!el) return;
  dragId = el.dataset.drag; e.dataTransfer.setData("text/plain", dragId); e.dataTransfer.effectAllowed = "move"; el.classList.add("dragging");
});
document.addEventListener("dragend", (e) => { e.target.closest?.("[data-drag]")?.classList.remove("dragging"); document.querySelectorAll(".drop").forEach((x) => x.classList.remove("drop")); });
document.addEventListener("dragover", (e) => {
  const tgt = e.target.closest?.(".cell[data-day], .col[data-stage]");
  if (!tgt || !dragId) return;
  e.preventDefault(); document.querySelectorAll(".drop").forEach((x) => x !== tgt && x.classList.remove("drop")); tgt.classList.add("drop");
});
document.addEventListener("drop", async (e) => {
  const tgt = e.target.closest?.(".cell[data-day], .col[data-stage]");
  const idea = state.ideas.find((x) => x.id === dragId);
  dragId = null;
  if (!tgt || !idea) return;
  e.preventDefault(); tgt.classList.remove("drop");
  try {
    if (tgt.dataset.day) { await saveIdea({ ...idea, due: tgt.dataset.day, status: idea.status === "idea" ? "planned" : idea.status }, true); toast(`Scheduled for ${fmt(tgt.dataset.day, { weekday: "short", month: "short", day: "numeric" })}`); }
    else if (tgt.dataset.stage !== idea.status) { await saveIdea({ ...idea, status: tgt.dataset.stage }, true); toast(`Moved to ${STAGES.find((s) => s[0] === tgt.dataset.stage)[1]}`); }
  } catch (ex) { toast(ex.message); }
});

$("#cal-prev").onclick = () => { const c = state.cal; state.cal = c.m ? { y: c.y, m: c.m - 1 } : { y: c.y - 1, m: 11 }; renderCalendar(); };
$("#cal-next").onclick = () => { const c = state.cal; state.cal = c.m < 11 ? { y: c.y, m: c.m + 1 } : { y: c.y + 1, m: 0 }; renderCalendar(); };
$("#cal-today").onclick = () => { state.cal = null; renderCalendar(); };

$("#range").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-days]"); if (!b) return;
  state.days = Number(b.dataset.days); lsSet("tbd-range", state.days);
  syncRange(); state.view === "search" ? renderSearch() : renderOverview();
});
function syncRange() { for (const b of $("#range").children) b.setAttribute("aria-checked", String(Number(b.dataset.days) === state.days)); }

const TITLES = { overview: null, search: "Google Search", calendar: "Content calendar", ideas: "Ideas board" };
function route() {
  const v = (location.hash || "#overview").slice(1);
  state.view = TITLES.hasOwnProperty(v) ? v : "overview";
  for (const k of Object.keys(TITLES)) $("#view-" + k).hidden = k !== state.view;
  document.querySelectorAll("[data-view]").forEach((a) => a.setAttribute("aria-current", a.dataset.view === state.view ? "page" : "false"));
  $("#page-title").textContent = TITLES[state.view] || greeting();
  $("#range").hidden = !["overview", "search"].includes(state.view);
  renderAll();
}
window.addEventListener("hashchange", route);
let resizeT; window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (state.view === "overview") renderOverview(); if (state.view === "search") renderSearch(); }, 150); });

function renderAll() {
  if ($("#app").hidden) return;
  if (state.view === "overview") renderOverview();
  if (state.view === "search") renderSearch();
  if (state.view === "calendar") renderCalendar();
  if (state.view === "ideas") renderBoard();
}

// ---------------------------------------------------------------------------
// Sign-in screen
// ---------------------------------------------------------------------------
let artRaf = null;
function loginArt() {
  const cv = $("#login-canvas"); const ctx = cv.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1);
  function size() { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }
  size(); addEventListener("resize", size);
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8 * dpr) {
        const y = H * (0.28 + k * 0.1) + Math.sin(x / (W / (2.2 + k * 0.3)) + t * (0.35 + k * 0.07) + k) * H * 0.035;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(127,214,255,${0.05 + k * 0.025})`; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    }
    const bx = W * 0.78, by = H * 0.22, p = 1 + Math.sin(t * 2) * 0.06;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, 160 * dpr);
    g.addColorStop(0, "rgba(255,179,71,.35)"); g.addColorStop(1, "rgba(255,179,71,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(bx, by, 16 * dpr * p, 0, 6.283); ctx.fillStyle = "#ffb347"; ctx.fill();
    ctx.beginPath(); ctx.arc(bx, by, 30 * dpr * p, 0, 6.283); ctx.strokeStyle = "rgba(255,179,71,.35)"; ctx.lineWidth = 3 * dpr; ctx.stroke();
    if (!REDUCED && !$("#login").hidden) artRaf = requestAnimationFrame(frame);
  }
  cancelAnimationFrame(artRaf); artRaf = requestAnimationFrame(frame);
}

function showLogin(msg = "") {
  $("#boot").hidden = true; $("#app").hidden = true; $("#login").hidden = false;
  $("#login-form").hidden = false; $("#reset-form").hidden = true;
  $("#demo-cta").hidden = CONFIGURED;
  $("#login-msg").textContent = msg; $("#login-msg").className = "form-msg";
  loginArt();
}
function showReset() {
  showLogin(); $("#login-form").hidden = true; $("#reset-form").hidden = false; $("#new-password").focus();
}

$("#pw-toggle").addEventListener("click", (e) => {
  const on = $("#password").type === "password";
  $("#password").type = on ? "text" : "password";
  e.currentTarget.textContent = on ? "Hide" : "Show";
  e.currentTarget.setAttribute("aria-pressed", String(on));
});

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#login-msg"), btn = $("#login-btn");
  if (!CONFIGURED) { msg.textContent = "The dashboard isn't connected to its database yet. Use the sample data below for now."; return; }
  const email = $("#email").value.trim(), pw = $("#password").value;
  if (!email || !pw) { msg.textContent = "Enter your email and password."; return; }
  btn.disabled = true; btn.textContent = "Signing in…"; msg.textContent = "";
  try { await store.signIn(email, pw); await enter(); }
  catch (ex) { msg.textContent = /invalid/i.test(ex.message) ? "That email and password don't match. Try again or reset your password." : ex.message; }
  finally { btn.disabled = false; btn.textContent = "Sign in"; }
});

$("#forgot-btn").addEventListener("click", async () => {
  const msg = $("#login-msg"), email = $("#email").value.trim();
  if (!CONFIGURED) { msg.textContent = "Password reset works once the database is connected."; return; }
  if (!email) { msg.textContent = "Type your email above first, then tap Forgot password."; $("#email").focus(); return; }
  try { await store.resetPassword(email); msg.className = "form-msg ok"; msg.textContent = `If ${email} has an account, a reset link is on its way.`; }
  catch (ex) { msg.textContent = ex.message; }
});

$("#reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = $("#new-password").value;
  if (pw.length < 8) { $("#reset-msg").textContent = "Use at least 8 characters."; return; }
  try { await store.updatePassword(pw); history.replaceState(null, "", location.pathname); toast("Password updated"); await enter(); }
  catch (ex) { $("#reset-msg").textContent = ex.message; }
});

$("#demo-btn").addEventListener("click", async () => { store = new DemoStore(); await enter(); });

async function signOut() {
  if (store) await store.signOut();
  if (store?.demo) {
    if (CONFIGURED) { store = new LiveStore(); await store.init(); } else store = null;
  }
  if (FORCE_DEMO) history.replaceState(null, "", location.pathname);
  showLogin("You're signed out.");
}
$("#signout-btn").addEventListener("click", signOut);
$("#tab-signout").addEventListener("click", signOut);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function enter() {
  state.user = await store.session();
  if (!state.user) return showLogin();
  if (!(await store.isAdmin())) { await store.signOut(); return showLogin("This account doesn't have access to the dashboard."); }
  $("#boot").hidden = false; $("#boot").textContent = "Loading your numbers…";
  const from = addDays(todayIn(TZ), -200);
  const [rows, ideas, searchTop] = await Promise.all([store.metrics(from), store.ideas(), store.searchTop()]);
  state.rows = rows; state.ideas = ideas; state.searchTop = searchTop;
  $("#who-email").textContent = state.user.email || "";
  $("#demo-note").hidden = !store.demo;
  $("#today-label").textContent = new Date().toLocaleDateString("en-CA", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
  $("#login").hidden = true; $("#boot").hidden = true; $("#app").hidden = false;
  cancelAnimationFrame(artRaf);
  syncRange(); route();
  // Blog drafts + posts load in the background from GitHub
  loadContent().then((c) => { state.content = c; state.contentNote = ""; renderAll(); })
    .catch(() => { state.content = store.demo ? demoContent : []; state.contentNote = store.demo ? "" : "Couldn't reach GitHub to load your drafts. Refresh to try again."; renderAll(); });
}

(async () => {
  try {
    if (FORCE_DEMO || !CONFIGURED) {
      store = FORCE_DEMO ? new DemoStore() : null;
      return FORCE_DEMO ? enter() : showLogin();
    }
    store = new LiveStore();
    await store.init();
    if (/type=recovery/.test(location.hash)) return showReset();
    const user = await store.session();
    return user ? enter() : showLogin();
  } catch (ex) {
    $("#boot").textContent = `Couldn't start the dashboard: ${ex.message}`;
  }
})();
