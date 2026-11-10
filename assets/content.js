// Reads your blog's drafts and published posts straight from the public GitHub repo,
// so the calendar always shows what's actually there.

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
    return { type: "post", id: `post:${file.name}`, day: publishDay(fm, fileDay), title, verdict: (fm.verdict || "").toUpperCase(), url: `${SITE}/posts/${slug}.html` };
  }
  const needsTake = /\[\[ADD YOUR TAKE/i.test(md);
  return {
    type: "draft", id: `draft:${file.name}`, day: fileDay, title, needsTake,
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

export async function loadContent() {
  const [drafts, posts] = await Promise.all([listDir("drafts"), listDir("posts")]);
  const jobs = [...drafts.map((f) => ["draft", f]), ...posts.map((f) => ["post", f])];
  const events = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const [kind, f] = jobs[i++];
      const key = `tbd-md:${f.sha}`;
      let md = cacheGet(key);
      if (md == null) {
        const r = await fetch(f.download_url);
        md = r.ok ? await r.text() : "";
        if (md) cacheSet(key, md.slice(0, 4000)); // frontmatter + the take placeholder live near the top
      }
      events.push(toEvent(kind, f, md));
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return events.filter((e) => e.day);
}
