// TechByDave Dashboard: daily data collector (GitHub Actions, Node 20+, no packages).
// Pulls numbers from each service you've added a key for, and saves them to Supabase.
// Any service without a key is skipped, so you can add them one at a time.
//
//   Website     Cloudflare Web Analytics  -> CF_API_TOKEN (secret), CF_ACCOUNT_ID (variable), SITE_HOST (variable, default techbydave.com)
//   Newsletter  Kit                       -> KIT_API_KEY (secret)
//   YouTube     YouTube Data API          -> YOUTUBE_API_KEY (secret), YOUTUBE_HANDLE (variable, default techby_dave)
//   Always      SUPABASE_URL (variable), SUPABASE_SERVICE_ROLE_KEY (secret)

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

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Add SUPABASE_URL (variable) and SUPABASE_SERVICE_ROLE_KEY (secret) first.");
  const today = dayIn(TZ);
  let failed = 0;
  for (const [name, job] of [["Website", website], ["Newsletter", newsletter], ["YouTube", youtube]]) {
    try { console.log(`${name}: ${await job(today)}`); }
    catch (err) { failed++; console.error(`${name}: failed - ${err.message}`); }
  }
  if (failed) process.exitCode = 1; // shows red in Actions so a broken key gets noticed
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
