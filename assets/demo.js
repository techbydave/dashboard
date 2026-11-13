// Sample data for demo mode (before Supabase is connected). Clearly labelled in the UI.
import { addDays } from "./metrics.js";

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function demoRows(today) {
  const r = rng(42);
  const rows = [];
  const start = addDays(today, -119);
  let i = 0;
  for (let d = start; d <= today; d = addDays(d, 1), i++) {
    const dow = new Date(d + "T00:00:00Z").getUTCDay();
    const base = 38 + i * 0.75;
    const visits = Math.round(base * (dow === 0 || dow === 6 ? 0.78 : 1.08) * (0.8 + r() * 0.45) + (i % 23 === 7 ? 70 : 0));
    rows.push({ day: d, source: "website", metric: "visits", value: visits });
    rows.push({ day: d, source: "website", metric: "pageviews", value: Math.round(visits * (1.5 + r() * 0.3)) });
    rows.push({ day: d, source: "newsletter", metric: "subscribers", value: Math.round(52 + i * 0.78 + r() * 2) });
    rows.push({ day: d, source: "youtube", metric: "followers", value: Math.round(268 + i * 1.3 + r() * 3) });
  }
  // weekly check-ins for the apps without free APIs
  const manual = { tiktok: [1180, 5.6], instagram: [780, 1.6], pinterest: [372, 1.2] };
  for (let k = 0; k * 7 <= 119; k++) {
    const d = addDays(today, -3 - k * 7);
    for (const [src, [b, g]] of Object.entries(manual)) {
      rows.push({ day: d, source: src, metric: "followers", value: Math.round(b + (119 - k * 7) * g + r() * 6) });
    }
  }
  // Google Search Console (Google reports about 2 days late)
  for (let k = 119; k >= 2; k--) {
    const day = addDays(today, -k), j = 119 - k;
    const impressions = Math.round((180 + j * 9) * (0.85 + r() * 0.3));
    const clicks = Math.round(impressions * (0.03 + r() * 0.015));
    rows.push({ day, source: "search", metric: "impressions", value: impressions });
    rows.push({ day, source: "search", metric: "clicks", value: clicks });
    rows.push({ day, source: "search", metric: "position", value: Math.round((24 - j * 0.09 + r() * 3) * 100) / 100 });
  }
  return rows;
}

export function demoSearchTop(today) {
  const q = [["pixel 11 pro fold price", 41, 820, 6.2], ["airpods pro 3 black friday", 33, 1210, 8.9], ["google smart glasses release date", 27, 940, 7.4],
    ["airtag 4 pack deal", 22, 510, 5.1], ["quest 2 end of support", 18, 690, 9.8], ["motorola signature 27", 12, 455, 11.3],
    ["is pixel 11 pro fold worth it", 9, 210, 6.7], ["coros pace 4 review", 7, 330, 14.2], ["cheap black friday gadgets 2026", 6, 610, 18.5], ["techbydave", 5, 14, 1.0]];
  const p = [["/posts/pixel-11-pro-fold.html", 58, 1430, 7.1], ["/posts/airpods-pro-3-deal.html", 39, 1650, 9.4], ["/posts/google-smart-glasses.html", 31, 1120, 7.9],
    ["/", 24, 380, 4.6], ["/posts/airtag-4-pack-deal.html", 22, 560, 5.3], ["/posts/quest-2-updates-end.html", 19, 760, 10.2], ["/about.html", 4, 60, 3.2]];
  const mk = (kind) => ([item, clicks, impressions, position]) => ({ kind, item: kind === "page" ? "https://techbydave.com" + item : item, clicks, impressions, ctr: clicks / impressions, position, period_end: addDays(today, -2) });
  return [...q.map(mk("query")), ...p.map(mk("page"))];
}

export function demoIdeas(today) {
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  return [
    { id: id(), title: "Pixel 11 Pro Fold: worth it or a waste? (Short)", platform: "TikTok", status: "filming", due: addDays(today, 1), notes: "Hook: $1,899 and the battery got smaller." },
    { id: id(), title: "AirPods Pro 3 at $199: real deal or fake sale?", platform: "YouTube", status: "planned", due: addDays(today, 4), notes: "" },
    { id: id(), title: "Black Friday tech under $50", platform: "Blog", status: "planned", due: addDays(today, 9), notes: "Doorbell cam, streamer, AirTag 4-pack." },
    { id: id(), title: "My budget filming setup", platform: "Instagram", status: "idea", due: null, notes: "DJI Mic Mini, tripod light kit, ND filter." },
    { id: id(), title: "Is the Switch 2 worth it this holiday?", platform: "TikTok", status: "idea", due: null, notes: "" },
    { id: id(), title: "Covered app launch post", platform: "Blog", status: "idea", due: null, notes: "Return windows + warranties tracker." },
    { id: id(), title: "Google smart glasses vs Meta Ray-Ban", platform: "YouTube", status: "posted", due: addDays(today, -3), notes: "" },
  ];
}

// Used only if GitHub can't be reached in demo mode.
export const demoContent = [
  { type: "post", id: "p1", day: "2026-10-31", title: "AirTag 2 4-Pack Deal: $69.99 Matches the Record Low", verdict: "BUY", url: "https://techbydave.com/" },
  { type: "post", id: "p2", day: "2026-11-01", title: "Motorola Signature 27 Launches Nov. 5 With a 200MP Zoom", verdict: "WAIT", url: "https://techbydave.com/" },
  { type: "post", id: "p3", day: "2026-11-03", title: "Pixel 11 Pro Fold Costs $1,899. Pixel 10 Pro Fold Owners, Skip It.", verdict: "SKIP", url: "https://techbydave.com/" },
  { type: "post", id: "p4", day: "2026-11-03", title: "Early Black Friday: The Cheap Gadgets Have the Deepest Cuts", verdict: "BUY", url: "https://techbydave.com/" },
  { type: "post", id: "p5", day: "2026-11-04", title: "Meta Sets the End Date for Quest 2 and Quest Pro Updates", verdict: "SKIP", url: "https://techbydave.com/" },
  { type: "post", id: "p6", day: "2026-11-10", title: "Google's First Smart Glasses Open for Preorder Nov. 12, No Price", verdict: "WAIT", url: "https://techbydave.com/" },
  { type: "draft", id: "d1", day: "2026-11-05", title: "Arduview's See-Through Handheld Got Pricier Than Its $49 Pitch", needsTake: true, url: "https://github.com/techbydave/techbydave" },
  { type: "draft", id: "d2", day: "2026-11-07", title: "ROG Xbox Ally X: Wait for the OLED X20 or Buy the $499 Ally", needsTake: true, url: "https://github.com/techbydave/techbydave" },
  { type: "draft", id: "d3", day: "2026-11-08", title: "Lomography's Gold-Plated Film Camera Is the MC-A in Fancy Dress", needsTake: true, url: "https://github.com/techbydave/techbydave" },
  { type: "draft", id: "d4", day: "2026-11-09", title: "AirPods Pro 3 at $199: Is the Early Black Friday Deal Good?", needsTake: true, url: "https://github.com/techbydave/techbydave" },
  { type: "draft", id: "d5", day: "2026-11-10", title: "Coros Pace 4: Worth $249 After the NYC Marathon Win?", needsTake: false, verdict: "WAIT", url: "https://github.com/techbydave/techbydave" },
];
