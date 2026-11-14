// TechByDave Dashboard: daily data collector (GitHub Actions, Node 20+, no packages).
// Pulls numbers from each service you've added a key for, and saves them to Supabase.
// Any service without a key is skipped, so you can add them one at a time.
//
//   Website     Cloudflare Web Analytics  -> CF_API_TOKEN (secret), CF_ACCOUNT_ID (variable), SITE_HOST (variable, default techbydave.com)
//   Newsletter  Kit                       -> KIT_API_KEY (secret)
//   YouTube     YouTube Data API          -> YOUTUBE_API_KEY (secret), YOUTUBE_HANDLE (variable, default techby_dave)
//   Search      Google Search Console     -> GSC_SERVICE_ACCOUNT (secret: the whole service-account JSON), GSC_SITE (variable, optional)
//   Instagram   Instagram API (Instagram Login) -> IG_ACCESS_TOKEN (secret). Renewed automatically and kept in the tokens table.
//   Always      SUPABASE_URL (variable), SUPABASE_SERVICE_ROLE_KEY (secret)

import { createSign, createHash } from "node:crypto";

const env = process.env;
const SUPABASE_URL = (env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";
const TZ = "America/Toronto";

export function dayIn(tz, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function getJSON(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function save(rows) {
  if (!rows.length) return;
  await getJSON(`${SUPABASE_URL}/rest/v1/metrics`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }))),
  });
}

// ---- Website: Cloudflare Web Analytics, last 8 days, one row per day ----
export function cloudflareRows(groups) {
  return groups.map((g) => [
    { day: g.dimensions.date, source: "website", metric: "pageviews", value: g.count },
    { day: g.dimensions.date, source: "website", metric: "visits", value: g.sum.visits },
  ]).flat();
}
async function website() {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return "skipped (add CF_API_TOKEN and CF_ACCOUNT_ID)";
  const end = new Date();
  const start = new Date(end.getTime() - 8 * 86400000);
  const query = `query ($account: string, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
    viewer { accounts(filter: { accountTag: $account }) {
      rumPageloadEventsAdaptiveGroups(limit: 100, filter: $filter, orderBy: [date_ASC]) {
        count sum { visits } dimensions { date }
      } } } }`;
  const filter = { AND: [{ datetime_geq: start.toISOString(), datetime_leq: end.toISOString() }] };
  if (env.CF_SITE_TAG) filter.AND.push({ siteTag: env.CF_SITE_TAG });
  else filter.AND.push({ requestHost: env.SITE_HOST || "techbydave.com" });
  const data = await getJSON("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { account: env.CF_ACCOUNT_ID, filter } }),
  });
  if (data.errors?.length) throw new Error(data.errors.map((e) => e.message).join("; "));
  const groups = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
  const rows = cloudflareRows(groups);
  await save(rows);
  return `${groups.length} day(s)`;
}

// ---- Newsletter: Kit active subscriber count ----
async function newsletter(today) {
  if (!env.KIT_API_KEY) return "skipped (add KIT_API_KEY)";
  const data = await getJSON("https://api.kit.com/v4/subscribers?status=active&include_total_count=true&per_page=1", {
    headers: { "X-Kit-Api-Key": env.KIT_API_KEY, Accept: "application/json" },
  });
  const total = data?.pagination?.total_count;
  if (typeof total !== "number") throw new Error("Kit didn't return a subscriber total.");
  await save([{ day: today, source: "newsletter", metric: "subscribers", value: total }]);
  return `${total} subscribers`;
}

// ---- YouTube: public channel statistics ----
async function youtube(today) {
  if (!env.YOUTUBE_API_KEY) return "skipped (add YOUTUBE_API_KEY)";
  const handle = (env.YOUTUBE_HANDLE || "techby_dave").replace(/^@/, "");
  const data = await getJSON(`https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(handle)}&key=${env.YOUTUBE_API_KEY}`);
  const s = data.items?.[0]?.statistics;
  if (!s) throw new Error(`No YouTube channel found for @${handle}.`);
  const rows = [
    { day: today, source: "youtube", metric: "views", value: Number(s.viewCount) },
    { day: today, source: "youtube", metric: "videos", value: Number(s.videoCount) },
  ];
  if (!s.hiddenSubscriberCount) rows.push({ day: today, source: "youtube", metric: "followers", value: Number(s.subscriberCount) });
  await save(rows);
  return `${s.subscriberCount} subscribers`;
}

// ---- Google Search Console: daily totals + top searches and pages ----
const b64url = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

async function googleToken(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = b64url(createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.private_key));
  const data = await getJSON("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claims}.${sig}` }),
  });
  return data.access_token;
}

export function searchDailyRows(rows) {
  return (rows || []).flatMap((r) => [
    { day: r.keys[0], source: "search", metric: "clicks", value: r.clicks },
    { day: r.keys[0], source: "search", metric: "impressions", value: r.impressions },
    { day: r.keys[0], source: "search", metric: "position", value: Math.round(r.position * 100) / 100 },
  ]);
}

export function searchTopRows(kind, rows, periodEnd) {
  return (rows || []).map((r) => ({
    kind, item: String(r.keys[0]).slice(0, 300), clicks: r.clicks, impressions: r.impressions,
    ctr: Math.round(r.ctr * 10000) / 10000, position: Math.round(r.position * 10) / 10, period_end: periodEnd,
  }));
}

async function search(today) {
  if (!env.GSC_SERVICE_ACCOUNT) return "skipped (add GSC_SERVICE_ACCOUNT)";
  let sa;
  try { sa = JSON.parse(env.GSC_SERVICE_ACCOUNT); } catch { throw new Error("GSC_SERVICE_ACCOUNT isn't valid JSON. Paste the whole downloaded key file."); }
  const token = await googleToken(sa, "https://www.googleapis.com/auth/webmasters.readonly");
  const sites = env.GSC_SITE ? [env.GSC_SITE] : [`sc-domain:${env.SITE_HOST || "techbydave.com"}`, `https://${env.SITE_HOST || "techbydave.com"}/`];
  const query = (site, body) => getJSON(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const end = today, start = addDaysISO(today, -16), topStart = addDaysISO(today, -30);
  let site = null, daily = null, lastErr = null;
  for (const s of sites) {
    try { daily = await query(s, { startDate: start, endDate: end, dimensions: ["date"], rowLimit: 100 }); site = s; break; }
    catch (err) { lastErr = err; }
  }
  if (!site) throw new Error(`Search Console refused access (${lastErr?.message?.slice(0, 120)}). Add ${sa.client_email} as a user on your Search Console property.`);
  const [queries, pages] = await Promise.all([
    query(site, { startDate: topStart, endDate: end, dimensions: ["query"], rowLimit: 25 }),
    query(site, { startDate: topStart, endDate: end, dimensions: ["page"], rowLimit: 25 }),
  ]);
  await save(searchDailyRows(daily.rows));
  const top = [...searchTopRows("query", queries.rows, end), ...searchTopRows("page", pages.rows, end)];
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
  await getJSON(`${SUPABASE_URL}/rest/v1/search_top?kind=in.(query,page)`, { method: "DELETE", headers });
  if (top.length) await getJSON(`${SUPABASE_URL}/rest/v1/search_top`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(top) });
  return `${daily.rows?.length || 0} day(s), ${queries.rows?.length || 0} searches, ${pages.rows?.length || 0} pages (${site})`;
}

// ---- Instagram: follower count via the Instagram API with Instagram Login ----
// Long-lived tokens last 60 days. We renew weekly and keep the newest one in the
// private `tokens` table, so the GitHub secret only has to be set once. If you
// paste a new token into the secret later, it takes over (matched by its hash).
const sha = (s) => createHash("sha256").update(String(s)).digest("hex");
const RENEW_AFTER_DAYS = 7;

export function pickInstagramToken(stored, envToken) {
  const seed = sha(envToken);
  if (stored && stored.seed === seed && stored.value) return { token: stored.value, seed, renewedAt: stored.updated_at };
  return { token: envToken, seed, renewedAt: null };
}

async function tokenRow(name) {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  try {
    const rows = await getJSON(`${SUPABASE_URL}/rest/v1/tokens?name=eq.${name}&select=value,seed,updated_at`, { headers });
    return { ok: true, row: rows?.[0] || null };
  } catch { return { ok: false, row: null }; }
}

async function saveTokenRow(name, value, seed) {
  await getJSON(`${SUPABASE_URL}/rest/v1/tokens`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ name, value, seed, updated_at: new Date().toISOString() }]),
  });
}

async function instagram(today) {
  if (!env.IG_ACCESS_TOKEN) return "skipped (add IG_ACCESS_TOKEN)";
  const igUserId = env.IG_USER_ID || "17841471747675635"; // @techby_dave
  // Never-expiring system-user tokens (Unified login) are read through graph.facebook.com.
  const viaFacebook = async (tok) => getJSON(`https://graph.facebook.com/v25.0/${igUserId}?fields=username,followers_count,media_count&access_token=${encodeURIComponent(tok)}`);
  try {
    const me = await viaFacebook(env.IG_ACCESS_TOKEN.trim());
    if (typeof me?.followers_count === "number") return await saveInstagram(today, me, " (never-expiring token)");
  } catch { /* not a system-user token: fall through to Instagram Login */ }

  const { ok: tableOk, row } = await tokenRow("instagram");
  let { token, seed, renewedAt } = pickInstagramToken(row, env.IG_ACCESS_TOKEN.trim());
  let note = "";
  const age = renewedAt ? (Date.now() - Date.parse(renewedAt)) / 86400000 : Infinity;
  if (tableOk && age >= RENEW_AFTER_DAYS) {
    try {
      const fresh = await getJSON(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
      if (fresh?.access_token) { token = fresh.access_token; await saveTokenRow("instagram", token, seed); note = ", token renewed"; }
    } catch (err) { note = `, token not renewed yet (${err.message.slice(0, 80)})`; }
  } else if (!tableOk) note = ", can't renew the token: run the tokens part of supabase/schema.sql";
  const me = await getJSON(`https://graph.instagram.com/me?fields=username,followers_count,media_count&access_token=${encodeURIComponent(token)}`);
  if (typeof me?.followers_count !== "number") throw new Error("Instagram didn't return a follower count. Is the account a Creator or Business account?");
  return saveInstagram(today, me, note);
}

async function saveInstagram(today, me, note) {
  await save([
    { day: today, source: "instagram", metric: "followers", value: me.followers_count },
    ...(typeof me.media_count === "number" ? [{ day: today, source: "instagram", metric: "posts", value: me.media_count }] : []),
  ]);
  return `${me.followers_count} followers (@${me.username})${note}`;
}

function addDaysISO(day, n) { const d = new Date(day + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log("::notice::Not set up yet: add SUPABASE_URL (variable) and SUPABASE_SERVICE_ROLE_KEY (secret). Skipping.");
    return;
  }
  const today = dayIn(TZ);
  let failed = 0;
  for (const [name, job] of [["Website", website], ["Newsletter", newsletter], ["YouTube", youtube], ["Search", search], ["Instagram", instagram]]) {
    try { console.log(`${name}: ${await job(today)}`); }
    catch (err) { failed++; console.error(`${name}: failed - ${err.message}`); }
  }
  if (failed) process.exitCode = 1; // shows red in Actions so a broken key gets noticed
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
