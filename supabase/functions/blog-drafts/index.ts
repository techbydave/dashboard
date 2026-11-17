// Supabase Edge Function: blog-drafts  (powers "Needs you" in the dashboard)
// Saves Dave's answers into a blog draft (and any photo he adds) in the techbydave/techbydave repo,
// and can run the "Publish edited drafts" workflow right away instead of waiting for 9:00am.
//
// Secret (Supabase > Edge Functions > Secrets): BLOG_GITHUB_TOKEN, a fine-grained GitHub token for the
// techbydave/techbydave repo only, with "Contents: Read and write" and "Actions: Read and write".
// Only signed-in dashboard admins (public.is_admin()) can call it. The token never reaches the browser.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://dashboard.techbydave.com,https://techbydave.github.io,http://localhost:8765").split(",").map((s) => s.trim());
const REPO = "techbydave/techbydave";
const GH = `https://api.github.com/repos/${REPO}`;
const DRAFT_PATH = /^drafts\/[a-z0-9][a-z0-9-]{0,150}\.md$/;
const IMAGE_NAME = /^[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp)$/;
const MAX_DRAFT = 200_000, MAX_IMAGE_B64 = 4_000_000, MAX_IMAGES = 4;

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

async function github(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("BLOG_GITHUB_TOKEN");
  if (!token) throw new HttpError(501, "Saving from the dashboard isn't set up yet: add BLOG_GITHUB_TOKEN in Supabase (Edge Functions > Secrets).");
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token.trim()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json", "User-Agent": "techbydave-dashboard", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let data: any = null; try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (res.status === 409) throw new HttpError(409, "This draft changed on GitHub since you opened it. Close it, refresh and try again.");
  if (res.status === 401) throw new HttpError(502, "GitHub rejected BLOG_GITHUB_TOKEN. It may have expired: make a new one and save it in Supabase.");
  if (res.status === 403 || res.status === 404 && init.method === "POST")
    throw new HttpError(502, "BLOG_GITHUB_TOKEN can't do that. Give it Contents and Actions \"Read and write\" on techbydave/techbydave.");
  if (!res.ok) throw new HttpError(502, `GitHub error ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data;
}

export function checkDraft(content: unknown) {
  const s = String(content ?? "");
  if (!s.trim() || s.length > MAX_DRAFT) throw new HttpError(400, "The draft is empty or too long.");
  const fm = s.match(/^---\s*\n([\s\S]*?)\n---\s*(\n|$)/);
  if (!fm || !/^title:/m.test(fm[1]) || !/^date:/m.test(fm[1])) throw new HttpError(400, "The draft lost its top section (title, date). Nothing was saved.");
  return s;
}

const b64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

export async function handle(req: Request): Promise<Response> {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405, h);

  const auth = req.headers.get("authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const check = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST", headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" }, body: "{}",
  });
  if (!check.ok || (await check.json()) !== true) return json({ error: "Not allowed. Sign in to the dashboard first." }, 403, h);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400, h); }

  try {
    switch (body.action) {
      case "ready":
        return json({ ready: Boolean(Deno.env.get("BLOG_GITHUB_TOKEN")) }, 200, h);

      case "save": {
        const path = String(body.path ?? "");
        if (!DRAFT_PATH.test(path)) throw new HttpError(400, "That isn't a draft file.");
        if (!/^[0-9a-f]{40}$/.test(String(body.sha ?? ""))) throw new HttpError(400, "Missing the draft's version. Refresh and try again.");
        const content = checkDraft(body.content);
        const images = Array.isArray(body.images) ? body.images : [];
        if (images.length > MAX_IMAGES) throw new HttpError(400, `Add up to ${MAX_IMAGES} photos at a time.`);
        const name = path.slice("drafts/".length, -3);
        // Photos first, so the draft never points at a picture that isn't there yet.
        for (const img of images) {
          const file = String(img?.name ?? "");
          const data = String(img?.base64 ?? "");
          if (!IMAGE_NAME.test(file) || !data || data.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(data))
            throw new HttpError(400, "That photo couldn't be saved. Use a JPG or PNG under 3 MB.");
          await github(`/contents/images/${file}`, { method: "PUT", body: JSON.stringify({ message: `Add photo ${file} (from the dashboard)`, content: data, branch: "main" }) });
        }
        const res = await github(`/contents/${path}`, {
          method: "PUT",
          body: JSON.stringify({ message: `Fill in draft: ${name} (from the dashboard)`, content: b64(content), sha: body.sha, branch: "main" }),
        });
        return json({ sha: res?.content?.sha ?? null }, 200, h);
      }

      case "publish": {
        await github(`/actions/workflows/publish-drafts.yml/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main" }) });
        return json({ started: true }, 200, h);
      }

      default:
        return json({ error: "Unknown action." }, 400, h);
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    console.error("blog-drafts:", err);
    return json({ error: err instanceof HttpError ? err.message : "Something went wrong. Try again." }, status, h);
  }
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") Deno.serve(handle);
