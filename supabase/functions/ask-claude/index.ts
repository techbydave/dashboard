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
const DEFAULT_MODEL = "gemini-flash";
const MAX_MESSAGES = 40;
const MAX_CHARS = 120_000;

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
- Write in plain language. Use Markdown sparingly (bold, short lists, code blocks for code).`;

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
  const messages = raw
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 20_000) }));
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
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: choice.id, max_tokens: 4096, system, messages, stream: true }),
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
async function gemini(choice: { id: string; fallback?: string }, system: string, messages: { role: string; content: string }[], h: Record<string, string>) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return json({ error: "Gemini isn't set up: add GEMINI_API_KEY in Supabase (Edge Functions > Secrets)." }, 500, h);
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: 4096 },
  });
  const call = (id: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:streamGenerateContent?alt=sse`, {
    method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body,
  });
  let upstream = await call(choice.id);
  if (!upstream.ok && choice.fallback && [404, 429, 500, 503].includes(upstream.status)) upstream = await call(choice.fallback);
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
