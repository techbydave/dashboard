// Supabase Edge Function: ask-claude  (powers "TechByDave AI" in the dashboard)
// Chats with Google Gemini (free tier, GEMINI_API_KEY secret) or Claude (ANTHROPIC_API_KEY secret).
// Keys stay here on the server; the browser never sees them. Only signed-in dashboard admins
// (public.is_admin()) can use it. Replies are streamed back in one format for both providers.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://dashboard.techbydave.com,https://techbydave.github.io,http://localhost:8765").split(",").map((s) => s.trim());
// Dashboard model id -> provider + real model id. Gemini "latest" aliases follow Google's newest Flash models.
const MODELS: Record<string, { provider: "gemini" | "claude"; id: string; fallback?: string }> = {
  "gemini-flash": { provider: "gemini", id: "gemini-flash-latest", fallback: "gemini-flash-lite-latest" },
  "gemini-flash-lite": { provider: "gemini", id: "gemini-flash-lite-latest" },
  "claude-sonnet-5-5": { provider: "claude", id: "claude-sonnet-5-5" },
  "claude-opus-5-5": { provider: "claude", id: "claude-opus-5-5" },
};
const DEFAULT_MODEL = "gemini-flash-lite";
const MAX_MESSAGES = 40;
const MAX_CHARS = 120_000;
// Pictures (screenshots, photos, video frames) the page attaches to user messages.
const MAX_IMAGES = 24, MAX_IMAGE_B64 = 2_000_000, MAX_TOTAL_B64 = 14_000_000;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
type Img = { media_type: string; data: string };
type Msg = { role: string; content: string; images?: Img[] };

const SYSTEM = `You are TechByDave AI, Dave's personal assistant inside his private TechByDave dashboard.

About Dave and TechByDave:
- Dave runs TechByDave (techbydave.com), a consumer-tech and gadget blog, rebranded from "Tech Treck". Based in Toronto.
- Angle: "Worth it or a waste?" honest buy / wait / skip verdicts, plus smarter buys on a budget, for readers anywhere.
- Channels: the blog, a faceless YouTube Shorts channel (@techby_dave), TikTok, Instagram, X and Pinterest (all techby_dave), and a Kit newsletter.
- Money: Amazon Influencer storefront and affiliate links, Google AdSense (working toward approval), brand review units.
- Mission: push the best tech content; vision: grow an audience and one day found a foundation that helps people in need.
- He also plans apps at apps.techbydave.com.

How to respond:
- Be warm, direct and genuinely useful, like a sharp friend who knows tech, content and the creator business.
- Lead with the answer. Keep it short by default; go deeper when he asks. Use short lists when they help scanning.
- Be honest: if an idea is weak or a number looks bad, say so kindly and suggest what to do about it.
- When he shares numbers, read them carefully and don't invent figures you weren't given.
- If you don't know something current (prices, launches, news), say so rather than guessing.
- Write in plain language. Use Markdown sparingly (bold, short lists, code blocks for code).

When he attaches pictures:
- Screenshots: read them closely (numbers, text, settings, errors) and answer about what's actually shown.
- Videos arrive as still frames with their timestamps, without sound. Say so if sound matters. To help him make a video better, be specific and tied to timestamps: the hook in the first 2 seconds, on-screen text size and placement (keep clear of the bottom and right edges where TikTok, Reels and Shorts put their buttons), pacing and dead moments to cut, framing and lighting, the end card, and which frame would make the best cover. Give the 3 changes with the biggest payoff first.`;

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

Deno.serve(async (req) => {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405, h);

  // 1. Only dashboard admins.
  const auth = req.headers.get("authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const check = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST", headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" }, body: "{}",
  });
  if (!check.ok || (await check.json()) !== true) return json({ error: "Not allowed. Sign in to the dashboard first." }, 403, h);

  // 2. Validate what the page sent.
  let body: { messages?: unknown; model?: unknown; context?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400, h); }
  const raw = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  let imageCount = 0, imageBytes = 0, badImage = false;
  const messages: Msg[] = raw
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && (m.content.trim() || Array.isArray(m.images)))
    .map((m: any) => {
      const out: Msg = { role: m.role, content: (m.content || "").slice(0, 20_000) };
      if (m.role === "user" && Array.isArray(m.images)) {
        const imgs = m.images.filter((i: any) => IMAGE_TYPES.has(i?.media_type) && typeof i?.data === "string" && /^[A-Za-z0-9+/=]+$/.test(i.data));
        if (imgs.length !== m.images.length || imgs.some((i: Img) => i.data.length > MAX_IMAGE_B64)) badImage = true;
        imageCount += imgs.length; imageBytes += imgs.reduce((n: number, i: Img) => n + i.data.length, 0);
        if (imgs.length) out.images = imgs.map((i: Img) => ({ media_type: i.media_type, data: i.data }));
        if (!out.content.trim()) out.content = "(see the attached pictures)";
      }
      return out;
    });
  if (badImage) return json({ error: "One of the pictures couldn't be read. Try a JPG or PNG." }, 400, h);
  if (imageCount > MAX_IMAGES || imageBytes > MAX_TOTAL_B64) return json({ error: "Too many pictures in this chat. Start a new chat and attach fewer files." }, 400, h);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Send a message first." }, 400, h);
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json({ error: "This chat is too long. Start a new one." }, 400, h);
  const choice = MODELS[String(body.model)] ?? MODELS[DEFAULT_MODEL];
  const context = typeof body.context === "string" ? body.context.slice(0, 8_000) : "";
  const engine = choice.provider === "gemini" ? "Google Gemini" : "Anthropic's Claude";
  const system = `${SYSTEM}\n- If asked what powers you: TechByDave AI is running on ${engine} right now.` +
    (context ? `\n\nHis dashboard right now (use when relevant):\n${context}` : "");

  if (choice.provider === "gemini") return gemini(choice, system, messages, h);

  // 3. Ask Claude and stream the answer straight back.
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "Claude isn't set up: add ANTHROPIC_API_KEY in Supabase (Edge Functions > Secrets), or pick a Gemini model." }, 500, h);
  const claudeMessages = messages.map((m) => m.images?.length
    ? { role: m.role, content: [...m.images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } })), { type: "text", text: m.content }] }
    : { role: m.role, content: m.content });
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: choice.id, max_tokens: 4096, system, messages: claudeMessages, stream: true }),
  });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    let msg = text.slice(0, 300);
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* keep raw */ }
    return json({ error: `Claude API: ${msg}` }, upstream.status === 401 ? 502 : upstream.status, h);
  }
  return new Response(upstream.body, { headers: { ...h, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
});

// ---- Google Gemini: stream, then re-emit as the same text events the page already understands ----
async function gemini(choice: { id: string; fallback?: string }, system: string, messages: Msg[], h: Record<string, string>) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return json({ error: "Gemini isn't set up: add GEMINI_API_KEY in Supabase (Edge Functions > Secrets)." }, 500, h);
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user",
      parts: [...(m.images ?? []).map((i) => ({ inline_data: { mime_type: i.media_type, data: i.data } })), { text: m.content }] })),
    generationConfig: { maxOutputTokens: 4096 },
  });
  // If a model hasn't started answering within 20s (busy free tier), give up on it and use the fallback.
  const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
  const call = async (id: string, waitMs?: number): Promise<Response> => {
    const ctl = new AbortController();
    const go = async () => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:streamGenerateContent?alt=sse`, {
        method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body, signal: ctl.signal,
      });
      if (!res.ok || !res.body || !waitMs) return res;
      // Wait for the first chunk too, so a model that accepts the request but stalls still falls back.
      const reader = res.body.getReader();
      const first = await reader.read();
      const rest = new ReadableStream<Uint8Array>({
        start(c) { if (first.value) c.enqueue(first.value); if (first.done) c.close(); },
        async pull(c) { const { value, done } = await reader.read(); if (done) c.close(); else c.enqueue(value); },
        cancel() { reader.cancel(); },
      });
      return new Response(rest, { status: res.status, headers: res.headers });
    };
    if (!waitMs) return go();
    try { return await Promise.race([go(), timeout(waitMs)]); }
    catch (err) {
      ctl.abort();
      if ((err as Error).message === "timeout") return new Response('{"error":{"message":"timed out"}}', { status: 504 });
      throw err;
    }
  };
  let upstream = await call(choice.id, choice.fallback ? 20_000 : undefined);
  if (!upstream.ok && choice.fallback && [404, 429, 500, 503, 504].includes(upstream.status)) upstream = await call(choice.fallback);
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    let msg = text.slice(0, 300);
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* keep raw */ }
    if (upstream.status === 429) msg = "Gemini's free limit is used up for now. Wait a minute (or until tomorrow) and try again.";
    return json({ error: `Gemini: ${msg}` }, upstream.status === 400 || upstream.status === 403 ? 502 : upstream.status, h);
  }
  const enc = new TextEncoder(), dec = new TextDecoder();
  let buf = "";
  const emit = (ctl: TransformStreamDefaultController<Uint8Array>, obj: unknown, event: string) =>
    ctl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(obj)}\n\n`));
  const handle = (chunk: string, ctl: TransformStreamDefaultController<Uint8Array>) => {
    const data = chunk.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
    if (!data) return;
    let msg: any; try { msg = JSON.parse(data); } catch { return; }
    if (msg.error) return emit(ctl, { type: "error", error: { message: msg.error.message ?? "Gemini error" } }, "error");
    const parts = msg.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p: any) => !p.thought && typeof p.text === "string").map((p: any) => p.text).join("");
    if (text) emit(ctl, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }, "content_block_delta");
  };
  const out = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(bytes, ctl) {
      buf += dec.decode(bytes, { stream: true }).replace(/\r\n/g, "\n");
      const chunks = buf.split("\n\n"); buf = chunks.pop() ?? "";
      for (const c of chunks) handle(c, ctl);
    },
    flush(ctl) { if (buf.trim()) handle(buf, ctl); emit(ctl, { type: "message_stop" }, "message_stop"); },
  }));
  return new Response(out, { headers: { ...h, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}
