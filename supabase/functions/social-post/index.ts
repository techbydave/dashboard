// Supabase Edge Function: social-post  (powers the "Post" page in the dashboard)
// Publishes Dave's photos and videos to his social accounts through Zernio (zernio.com), whose apps are
// already approved by Instagram, TikTok, YouTube, X and Pinterest, so posts go public right away.
// Also writes AI suggestions for titles, captions and hashtags with Google Gemini (free tier).
//
// Instagram can also post directly through Dave's own Meta app (free): set IG_ACCESS_TOKEN, a token with
// instagram_content_publish. It shows up as an account when Zernio has no Instagram account connected.
//
// Secrets (Supabase > Edge Functions > Secrets): ZERNIO_API_KEY, IG_ACCESS_TOKEN, GEMINI_API_KEY (for suggestions).
// Only signed-in dashboard admins (public.is_admin()) can call it. Keys never reach the browser.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://dashboard.techbydave.com,https://techbydave.github.io,http://localhost:8765").split(",").map((s) => s.trim());
const ZERNIO = "https://zernio.com/api/v1";
const TZ = "America/Toronto";
export const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "pinterest", "facebook", "threads", "linkedin", "bluesky"];
const MEDIA_TYPES = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm))$/;

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

async function zernio(path: string, init: RequestInit = {}) {
  const key = Deno.env.get("ZERNIO_API_KEY");
  if (!key) throw new HttpError(500, "Posting isn't set up yet: add ZERNIO_API_KEY in Supabase (Edge Functions > Secrets).");
  const res = await fetch(`${ZERNIO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 300) }; }
  if (!res.ok) {
    const msg = data?.error?.message ?? data?.error ?? data?.message ?? data?.raw ?? `HTTP ${res.status}`;
    throw new HttpError(res.status === 401 ? 502 : res.status, `Zernio: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return data;
}

// ---- Instagram, direct through the Meta Graph API ------------------------------------------------
const IG_HOSTS = ["https://graph.facebook.com/v25.0", "https://graph.instagram.com/v25.0"];
const igUser = () => Deno.env.get("IG_USER_ID") || "17841471747675635"; // @techby_dave

async function ig(method: "GET" | "POST", path: string, params: Record<string, string>) {
  const token = Deno.env.get("IG_ACCESS_TOKEN");
  if (!token) throw new HttpError(500, "Instagram isn't set up: add IG_ACCESS_TOKEN in Supabase (Edge Functions > Secrets).");
  let last = "";
  for (const host of IG_HOSTS) {
    const qs = new URLSearchParams({ ...params, access_token: token.trim() });
    const res = method === "GET" ? await fetch(`${host}${path}?${qs}`) : await fetch(`${host}${path}`, { method: "POST", body: qs });
    const data: any = await res.json().catch(() => ({}));
    if (res.ok && !data.error) return data;
    last = data?.error?.error_user_msg ?? data?.error?.message ?? `HTTP ${res.status}`;
    // Only a token-type mismatch is worth trying on the other host.
    if (data?.error?.code !== 190 && !/access token|OAuth/i.test(last)) break;
  }
  if (/permission|\(#10\)|\(#200\)/i.test(last)) last += " Add instagram_content_publish to your Meta app's configuration, generate a new token and save it as IG_ACCESS_TOKEN.";
  throw new HttpError(502, `Instagram: ${last}`);
}

// ---- building the Zernio post -------------------------------------------------------------
type Target = {
  platform: string; accountId: string;
  caption?: string; title?: string; hashtags?: string;
  boardId?: string; link?: string;
  visibility?: string; madeForKids?: boolean;
  privacy?: string; allowComment?: boolean; allowDuet?: boolean; allowStitch?: boolean; consent?: boolean;
  firstComment?: string;
};

export const tagString = (raw = "") =>
  raw.split(/[\s,]+/).map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")).filter(Boolean)
    .filter((t, i, a) => a.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i).map((t) => `#${t}`).join(" ");

export function captionFor(t: Target) {
  const tags = tagString(t.hashtags);
  return [t.caption?.trim() ?? "", tags].filter(Boolean).join("\n\n");
}

export function buildPost(input: { targets: Target[]; media: { url: string; type: "image" | "video" }[]; when?: string | null; description?: string }) {
  if (!Array.isArray(input.targets) || !input.targets.length) throw new HttpError(400, "Pick at least one account.");
  if (!Array.isArray(input.media) || !input.media.length) throw new HttpError(400, "Add a photo or video first.");
  for (const m of input.media) {
    if (!/^https:\/\//.test(m.url) || !["image", "video"].includes(m.type)) throw new HttpError(400, "Bad media item.");
  }
  const isVideo = input.media.some((m) => m.type === "video");
  let tiktokSettings: Record<string, unknown> | undefined;
  const platforms = input.targets.map((t) => {
    if (!PLATFORMS.includes(t.platform) || !t.accountId || /^(direct|manual)-/.test(t.accountId)) throw new HttpError(400, `Unknown account: ${t.platform}`);
    const caption = captionFor(t);
    const entry: Record<string, unknown> = { platform: t.platform, accountId: t.accountId, customContent: caption };
    const psd: Record<string, unknown> = {};
    if (t.platform === "youtube") {
      if (!isVideo) throw new HttpError(400, "YouTube needs a video.");
      if (!t.title?.trim()) throw new HttpError(400, "YouTube needs a title.");
      psd.title = t.title.trim().slice(0, 100);
      psd.visibility = ["public", "unlisted", "private"].includes(t.visibility ?? "") ? t.visibility : "public";
      psd.madeForKids = !!t.madeForKids;
      const tags = tagString(t.hashtags).split(" ").filter(Boolean).map((x) => x.slice(1));
      if (tags.length) psd.tags = tags;
    }
    if (t.platform === "pinterest") {
      if (!t.boardId) throw new HttpError(400, "Pick a Pinterest board.");
      psd.boardId = t.boardId;
      if (t.title?.trim()) psd.title = t.title.trim().slice(0, 100);
      if (t.link?.trim()) {
        if (!/^https?:\/\//.test(t.link.trim())) throw new HttpError(400, "The Pinterest link must start with https://");
        psd.link = t.link.trim();
      }
    }
    if (t.platform === "tiktok") {
      if (!t.consent) throw new HttpError(400, "TikTok needs you to confirm the preview and consent box.");
      if (!t.privacy) throw new HttpError(400, "Pick who can see the TikTok post.");
      tiktokSettings = {
        privacy_level: t.privacy,
        allow_comment: t.allowComment !== false,
        ...(isVideo ? { allow_duet: t.allowDuet !== false, allow_stitch: t.allowStitch !== false } : {}),
        media_type: isVideo ? "video" : "photo",
        content_preview_confirmed: true,
        express_consent_given: true,
      };
    }
    if (t.firstComment?.trim() && ["instagram", "youtube", "facebook", "linkedin"].includes(t.platform)) {
      psd.firstComment = t.firstComment.trim();
    }
    if (Object.keys(psd).length) entry.platformSpecificData = psd;
    return entry;
  });

  const body: Record<string, unknown> = {
    content: (input.description ?? "").trim() || String(platforms[0].customContent ?? ""),
    mediaItems: input.media.map((m) => ({ url: m.url, type: m.type })),
    platforms,
  };
  if (tiktokSettings) body.tiktokSettings = tiktokSettings;
  if (input.when) {
    const t = Date.parse(input.when);
    if (Number.isNaN(t)) throw new HttpError(400, "That schedule time isn't valid.");
    if (t < Date.now() + 60_000) throw new HttpError(400, "Pick a time at least a minute from now, or post now.");
    body.scheduledFor = new Date(t).toISOString();
    body.timezone = TZ;
  } else {
    body.publishNow = true;
  }
  return body;
}

// ---- AI suggestions (Gemini) ----------------------------------------------------------------
const SUGGEST_RULES = `You write social posts for TechByDave, Dave's consumer-tech brand ("Worth it or a waste?" honest buy/wait/skip gadget verdicts and smarter buys on a budget; site techbydave.com; handle techby_dave).
Write in a friendly, punchy, honest voice. No clickbait claims, no made-up specs or prices: only use facts Dave gave you or that are plainly visible.
Return ONLY JSON shaped like {"platforms": {"<platform>": {"title": "...", "caption": "...", "hashtags": ["..."]}}} for exactly the platforms asked for.
Rules per platform:
- youtube: "title" required (max 90 chars, hooky, include the product name), caption = 2-4 sentence description, 5-8 hashtags.
- tiktok: no title, caption max 150 chars with a hook, 3-5 hashtags.
- instagram: no title, caption 1-3 short lines with a question or call to action, 5-10 hashtags.
- twitter: no title, caption under 230 chars, at most 2 hashtags, no links.
- pinterest: "title" (max 90 chars, searchable), caption = 1-2 keyword-rich sentences, 3-6 hashtags.
- others: no title, short caption, 3-5 hashtags.
Hashtags without the # sign. Mix 1-2 broad tags with specific ones; include "techbydave" once.`;

export function parseSuggestions(text: string, wanted: string[]) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new HttpError(502, "The AI didn't return suggestions. Try again.");
  let data: any;
  try { data = JSON.parse(m[0]); } catch { throw new HttpError(502, "The AI's suggestions were garbled. Try again."); }
  const src = data.platforms ?? data;
  const out: Record<string, { title: string; caption: string; hashtags: string }> = {};
  for (const p of wanted) {
    const s = src?.[p] ?? (p === "twitter" ? src?.x : undefined) ?? {};
    const tags = Array.isArray(s.hashtags) ? s.hashtags : String(s.hashtags ?? "").split(/[\s,]+/);
    out[p] = {
      title: String(s.title ?? "").trim(),
      caption: String(s.caption ?? "").trim(),
      hashtags: tagString(tags.join(" ")),
    };
  }
  return out;
}

async function suggest(body: any) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new HttpError(500, "AI suggestions need GEMINI_API_KEY in Supabase (Edge Functions > Secrets).");
  const wanted = (Array.isArray(body.platforms) ? body.platforms : []).filter((p: string) => PLATFORMS.includes(p));
  if (!wanted.length) throw new HttpError(400, "Pick at least one account first.");
  const about = String(body.about ?? "").slice(0, 2000);
  const parts: any[] = [{ text: `${SUGGEST_RULES}\n\nPlatforms: ${wanted.join(", ")}\nMedia: ${body.mediaType === "video" ? "a short video" : "a photo"}${body.fileName ? ` (file: ${String(body.fileName).slice(0, 80)})` : ""}\nWhat Dave says it's about: ${about || "(nothing yet: describe what you can see)"}` }];
  const frame = typeof body.frame === "string" ? body.frame.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (frame && frame[2].length < 1_500_000) parts.push({ inlineData: { mimeType: frame[1], data: frame[2] } });
  const call = (model: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { maxOutputTokens: 2048, responseMimeType: "application/json" } }),
  });
  let res = await call("gemini-flash-lite-latest");
  if (!res.ok && [404, 429, 500, 503].includes(res.status)) res = await call("gemini-flash-latest");
  if (!res.ok) {
    if (res.status === 429) throw new HttpError(429, "Gemini's free limit is used up for now. Try again in a minute.");
    throw new HttpError(502, `Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("");
  return { suggestions: parseSuggestions(text, wanted) };
}

// ---- handler ----------------------------------------------------------------------------------
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
  const id = (v: unknown) => { const s = String(v ?? ""); if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new HttpError(400, "Bad id."); return s; };

  try {
    switch (body.action) {
      case "accounts": {
        const accounts: any[] = [], warnings: string[] = [];
        if (Deno.env.get("ZERNIO_API_KEY")) {
          const data = await zernio("/accounts");
          accounts.push(...(data?.accounts ?? []).filter((a: any) => a.isActive !== false).map((a: any) => ({
            id: a._id ?? a.id, platform: a.platform, username: a.username ?? "", name: a.displayName ?? a.username ?? a.platform,
          })).filter((a: any) => PLATFORMS.includes(a.platform)));
        } else warnings.push("TikTok and YouTube aren't connected yet: add ZERNIO_API_KEY in Supabase (Edge Functions > Secrets).");
        if (!accounts.some((a) => a.platform === "instagram")) {
          if (Deno.env.get("IG_ACCESS_TOKEN")) {
            try {
              const me = await ig("GET", `/${igUser()}`, { fields: "username" });
              accounts.push({ id: "direct-instagram", platform: "instagram", username: me.username ?? "", name: me.username ?? "Instagram", direct: true });
            } catch (err) { warnings.push((err as Error).message); }
          } else warnings.push("Instagram isn't connected yet: add IG_ACCESS_TOKEN in Supabase (Edge Functions > Secrets).");
        }
        return json({ accounts, warnings }, 200, h);
      }
      case "ig-create": {
        const mediaUrl = String(body.mediaUrl ?? "");
        if (!/^https:\/\//.test(mediaUrl)) throw new HttpError(400, "Bad media item.");
        const caption = String(body.caption ?? "").slice(0, 2200);
        const params: Record<string, string> = body.mediaType === "video"
          ? { media_type: "REELS", video_url: mediaUrl, share_to_feed: "true", caption }
          : { image_url: mediaUrl, caption };
        const data = await ig("POST", `/${igUser()}/media`, params);
        return json({ containerId: data.id }, 200, h);
      }
      case "ig-status": {
        const data = await ig("GET", `/${id(body.containerId)}`, { fields: "status_code,status" });
        return json({ status: data.status_code ?? "IN_PROGRESS", detail: data.status ?? "" }, 200, h);
      }
      case "ig-publish": {
        const data = await ig("POST", `/${igUser()}/media_publish`, { creation_id: id(body.containerId) });
        let url: string | null = null;
        try { url = (await ig("GET", `/${id(data.id)}`, { fields: "permalink" })).permalink ?? null; } catch { /* link is optional */ }
        return json({ id: data.id, url }, 200, h);
      }
      case "boards": {
        const data = await zernio(`/accounts/${id(body.accountId)}/pinterest-boards`);
        const list = data?.boards ?? data?.data ?? (Array.isArray(data) ? data : []);
        return json({ boards: list.map((b: any) => ({ id: String(b.id ?? b._id), name: b.name ?? "Board" })) }, 200, h);
      }
      case "tiktok-info": {
        const data = await zernio(`/accounts/${id(body.accountId)}/tiktok/creator-info`);
        const info = data?.creatorInfo ?? data?.data ?? data ?? {};
        return json({
          privacyOptions: info.privacy_level_options ?? info.privacyLevelOptions ?? ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
          commentDisabled: !!(info.comment_disabled ?? info.commentDisabled),
          duetDisabled: !!(info.duet_disabled ?? info.duetDisabled),
          stitchDisabled: !!(info.stitch_disabled ?? info.stitchDisabled),
          maxDuration: info.max_video_post_duration_sec ?? info.maxVideoPostDurationSec ?? null,
          nickname: info.creator_nickname ?? info.creatorNickname ?? "",
        }, 200, h);
      }
      case "presign": {
        const filename = String(body.filename ?? "upload").replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "upload";
        const contentType = String(body.contentType ?? "");
        if (!MEDIA_TYPES.test(contentType)) throw new HttpError(400, "Use a JPG, PNG, WebP or GIF photo, or an MP4, MOV or WebM video.");
        const size = Number(body.size) || undefined;
        const data = await zernio("/media/presign", { method: "POST", body: JSON.stringify({ filename, contentType, ...(size ? { size } : {}) }) });
        return json({ uploadUrl: data.uploadUrl, publicUrl: data.publicUrl }, 200, h);
      }
      case "suggest":
        return json(await suggest(body), 200, h);
      case "publish": {
        const post = buildPost(body);
        const data = await zernio("/posts", { method: "POST", body: JSON.stringify(post) });
        return json(summarize(data?.post ?? data), 200, h);
      }
      case "status": {
        const data = await zernio(`/posts/${id(body.postId)}`);
        return json(summarize(data?.post ?? data), 200, h);
      }
      case "scheduled": {
        let data: any;
        try { data = await zernio("/posts?status=scheduled&limit=50"); }
        catch (err) {
          if (!(err instanceof HttpError) || err.status !== 400) throw err;
          data = await zernio("/posts?limit=50"); // older API without the status filter
        }
        const list = (data?.posts ?? data?.data ?? []).map(summarize).filter((p: any) => p.status === "scheduled");
        list.sort((a: any, b: any) => String(a.scheduledFor ?? "").localeCompare(String(b.scheduledFor ?? "")));
        return json({ posts: list }, 200, h);
      }
      case "cancel": {
        const postId = id(body.postId);
        const current = summarize((await zernio(`/posts/${postId}`))?.post);
        if (current.status === "published" || current.status === "partial")
          throw new HttpError(409, "This post has already gone out, so it can't be cancelled. Delete it in the app instead.");
        if (current.status === "publishing") throw new HttpError(409, "This post is going out right now, so it's too late to cancel.");
        await zernio(`/posts/${postId}`, { method: "DELETE" });
        return json({ cancelled: postId }, 200, h);
      }
      case "recent": {
        const data = await zernio("/posts?limit=10");
        const list = data?.posts ?? data?.data ?? [];
        return json({ posts: list.slice(0, 10).map(summarize) }, 200, h);
      }
      default:
        return json({ error: "Unknown action." }, 400, h);
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return json({ error: err instanceof Error ? err.message : "Something went wrong." }, status, h);
  }
}

export function summarize(p: any) {
  return {
    id: p?._id ?? p?.id ?? null,
    status: p?.status ?? "unknown",
    content: String(p?.content ?? "").slice(0, 140),
    scheduledFor: p?.scheduledFor ?? null,
    createdAt: p?.createdAt ?? null,
    media: (p?.mediaItems ?? []).slice(0, 1).map((m: any) => ({ url: m.url, type: m.type })),
    platforms: (p?.platforms ?? []).map((x: any) => ({
      platform: x.platform,
      username: x.accountId?.username ?? "",
      status: x.status ?? p?.status ?? "pending",
      url: x.platformPostUrl ?? null,
      error: x.errorMessage ?? x.error ?? null,
    })),
  };
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") Deno.serve(handle);
