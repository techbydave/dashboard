// Reads your blog's drafts and published posts straight from the public GitHub repo,
// so the calendar always shows what's actually there.

import { todoCount } from "./drafts.js";

export const REPO = "techbydave/techbydave";
export const SITE = "https://techbydave.com";

export function frontmatter(md) {
  const m = String(md).match(/^---\s*\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

export function dayFromName(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// The local day a post went live ("published: 2026-11-10T13:51:30-05:00" -> 2026-11-10)
export function publishDay(fm, fallback) {
  const p = fm.published || "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(p)) {
    const d = new Date(p);
    if (!isNaN(d)) return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  return (fm.date || fallback || "").slice(0, 10);
}

export function toEvent(kind, file, md) {
  const fm = frontmatter(md);
  const fileDay = dayFromName(file.name);
  const title = fm.title || file.name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "").replace(/-/g, " ");
  if (kind === "post") {
    const slug = fm.slug || file.name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
    return { type: "post", id: `post:${file.name}`, day: publishDay(fm, fileDay), title, verdict: (fm.verdict || "").toUpperCase(),
      review: (fm.type || "").toLowerCase() === "review", url: `${SITE}/posts/${slug}.html` };
  }
  const needsTake = /\[\[ADD YOUR TAKE/i.test(md);
  return {
    type: "draft", id: `draft:${file.name}`, day: fileDay, title, needsTake, todo: todoCount(md), file: file.name,
    verdict: (fm.verdict || "").toUpperCase(),
    url: `https://github.com/${REPO}/edit/main/drafts/${file.name}`,
  };
}

async function listDir(dir) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${dir}?ref=main`, { headers: { Accept: "application/vnd.github+json" } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub said ${res.status}`);
  return (await res.json()).filter((f) => f.type === "file" && f.name.endsWith(".md"));
}

function cacheGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function cacheSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// One draft, fresh from GitHub, with the sha needed to save it back.
export async function fetchDraft(name) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/drafts/${encodeURIComponent(name)}?ref=main`,
    { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
  if (res.status === 404) throw new Error("This draft isn't there anymore. It may have just been published.");
  if (!res.ok) throw new Error(`Couldn't load the draft from GitHub (${res.status}).`);
  const data = await res.json();
  return { sha: data.sha, base64: data.content };
}

export async function loadContent() {
  try { for (const k of Object.keys(localStorage)) if (k.startsWith("tbd-md:")) localStorage.removeItem(k); } catch {}
  const [drafts, posts] = await Promise.all([listDir("drafts"), listDir("posts")]);
  const jobs = [...drafts.map((f) => ["draft", f]), ...posts.map((f) => ["post", f])];
  const events = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const [kind, f] = jobs[i++];
      const key = `tbd-md2:${f.sha}`;
      let md = cacheGet(key);
      if (md == null) {
        const r = await fetch(f.download_url);
        md = r.ok ? await r.text() : "";
        // Drafts are kept whole (to count every placeholder); posts only need their frontmatter.
        if (md) cacheSet(key, kind === "draft" ? md : md.slice(0, 4000));
      }
      events.push(toEvent(kind, f, md));
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return events.filter((e) => e.day);
}
