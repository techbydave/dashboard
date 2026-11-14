// Supabase Edge Function: ask-claude
// Lets the dashboard chat with Claude using YOUR Anthropic API key, which stays here on the
// server (set it as the ANTHROPIC_API_KEY secret in Supabase). The browser never sees it.
// Only signed-in dashboard admins (public.is_admin()) can use it.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://dashboard.techbydave.com,https://techbydave.github.io,http://localhost:8765").split(",").map((s) => s.trim());
const MODELS = ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"];
const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_MESSAGES = 40;
const MAX_CHARS = 120_000;

const SYSTEM = `You are Claude, made by Anthropic, working as Dave's assistant inside his private TechByDave dashboard.

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

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "ANTHROPIC_API_KEY isn't set in Supabase yet (Edge Functions > Secrets)." }, 500, h);

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
  const model = MODELS.includes(String(body.model)) ? String(body.model) : DEFAULT_MODEL;
  const context = typeof body.context === "string" ? body.context.slice(0, 8_000) : "";
  const system = context ? `${SYSTEM}\n\nHis dashboard right now (use when relevant):\n${context}` : SYSTEM;

  // 3. Ask Claude and stream the answer straight back.
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 4096, system, messages, stream: true }),
  });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    let msg = text.slice(0, 300);
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* keep raw */ }
    return json({ error: `Claude API: ${msg}` }, upstream.status === 401 ? 502 : upstream.status, h);
  }
  return new Response(upstream.body, { headers: { ...h, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
});
