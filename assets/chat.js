// "Ask Claude" chat page. Talks to the ask-claude Supabase Edge Function, which holds
// your Anthropic API key and streams Claude's reply back here.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEY = "tbd-chat";
const MODEL_KEY = "tbd-chat-model";
const MAX_SAVED = 40;

export const MODELS = [
  ["claude-sonnet-5-5", "Sonnet 5.5", "Fast, great for most things"],
  ["claude-opus-5-5", "Opus 5.5", "Smartest, costs ~2× more"],
  ["claude-haiku-5-5", "Haiku 5.5", "Quickest and cheapest"],
];

const SUGGESTIONS = [
  "How are my numbers looking this month?",
  "Give me 5 'worth it or a waste?' Short ideas for this week",
  "Write a pitch email to a brand for a review unit",
  "What should I post next to grow Instagram?",
];

function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// --- tiny, safe Markdown -> HTML (escape first, then format) -------------------
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
export function renderMarkdown(src) {
  const parts = String(src).split(/```[\w-]*\n?/);
  let html = "";
  parts.forEach((part, i) => {
    if (i % 2 === 1) { html += `<pre><code>${esc(part.replace(/\n$/, ""))}</code></pre>`; return; }
    const lines = esc(part).split("\n");
    let list = null, para = [];
    const flushPara = () => { if (para.length) { html += `<p>${inline(para.join("<br>"))}</p>`; para = []; } };
    const flushList = () => { if (list) { html += `<${list.tag}>${list.items.map((x) => `<li>${inline(x)}</li>`).join("")}</${list.tag}>`; list = null; } };
    for (const line of lines) {
      const ul = line.match(/^\s*[-*•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/), hd = line.match(/^#{1,4}\s+(.*)/);
      if (ul || ol) {
        flushPara();
        const tag = ul ? "ul" : "ol";
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push((ul || ol)[1]);
      } else if (hd) { flushPara(); flushList(); html += `<h4>${inline(hd[1])}</h4>`; }
      else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line); }
    }
    flushPara(); flushList();
  });
  return html;
}

// --- streaming parser for Anthropic server-sent events -------------------------
export function parseSSE(buffer, onText) {
  const events = buffer.split("\n\n");
  const rest = events.pop();
  for (const ev of events) {
    const data = ev.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
    if (!data) continue;
    let msg; try { msg = JSON.parse(data); } catch { continue; }
    if (msg.type === "content_block_delta" && msg.delta?.type === "text_delta") onText(msg.delta.text);
    if (msg.type === "error") throw new Error(msg.error?.message || "Claude ran into an error.");
  }
  return rest;
}

// --- the page --------------------------------------------------------------------
export function createChat({ root, demo, endpoint, getToken, getContext, toast }) {
  let messages = lsGet(KEY, []);
  let model = lsGet(MODEL_KEY, MODELS[0][0]);
  let controller = null;

  root.innerHTML = `
    <div class="chat">
      <div class="chat-bar">
        <label class="chat-model"><span class="sr-only">Model</span>
          <select id="chat-model">${MODELS.map(([id, name, note]) => `<option value="${id}">${name} · ${note}</option>`).join("")}</select>
        </label>
        <button class="btn" type="button" id="chat-new"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New chat</button>
      </div>
      <div class="chat-log" id="chat-log" aria-live="polite"></div>
      <form class="chat-compose" id="chat-form">
        <textarea id="chat-input" rows="1" placeholder="Ask Claude anything…" aria-label="Message Claude"></textarea>
        <button class="chat-send" type="submit" id="chat-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </form>
      <p class="chat-foot muted">Uses your Anthropic API key. Claude can make mistakes, so double-check anything important.</p>
    </div>`;

  const log = root.querySelector("#chat-log"), form = root.querySelector("#chat-form"), input = root.querySelector("#chat-input");
  const send = root.querySelector("#chat-send"), sel = root.querySelector("#chat-model");
  sel.value = MODELS.some((m) => m[0] === model) ? model : MODELS[0][0];
  sel.addEventListener("change", () => { model = sel.value; lsSet(MODEL_KEY, model); });

  const save = () => lsSet(KEY, messages.slice(-MAX_SAVED));
  const bubble = (m) => `<div class="msg ${m.role}">${m.role === "assistant"
    ? `<div class="msg-avatar" aria-hidden="true">✳</div><div class="msg-body">${m.content ? renderMarkdown(m.content) : '<span class="typing"><i></i><i></i><i></i></span>'}</div>`
    : `<div class="msg-body">${esc(m.content).replace(/\n/g, "<br>")}</div>`}</div>`;

  function draw() {
    if (!messages.length) {
      log.innerHTML = `<div class="chat-empty">
        <div class="chat-mark" aria-hidden="true">✳</div>
        <h2>What are we working on, Dave?</h2>
        <p class="muted">Claude can see your dashboard numbers, so ask about growth, content ideas, pitches, anything.</p>
        <div class="chat-suggest">${SUGGESTIONS.map((s) => `<button type="button" class="suggest">${esc(s)}</button>`).join("")}</div>
      </div>`;
      log.querySelectorAll(".suggest").forEach((b) => b.addEventListener("click", () => { input.value = b.textContent; submit(); }));
      return;
    }
    log.innerHTML = messages.map(bubble).join("");
    log.scrollTop = log.scrollHeight;
  }

  function setBusy(busy) {
    send.classList.toggle("stop", busy);
    send.setAttribute("aria-label", busy ? "Stop" : "Send");
    send.innerHTML = busy ? '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  async function submit() {
    if (controller) { controller.abort(); return; }
    const text = input.value.trim();
    if (!text) return;
    input.value = ""; autosize();
    messages.push({ role: "user", content: text });
    const reply = { role: "assistant", content: "" };
    messages.push(reply);
    draw();
    const live = () => log.lastElementChild?.querySelector(".msg-body");

    if (demo) {
      reply.content = "This is the demo, so I'm not connected yet. Once your Anthropic API key is added in Supabase, I'll answer here using your real dashboard numbers.";
      live().innerHTML = renderMarkdown(reply.content); save(); return;
    }

    controller = new AbortController(); setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, context: getContext(), messages: messages.slice(0, -1).map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) {
        let err = `Something went wrong (${res.status}).`;
        try { err = (await res.json()).error || err; } catch {}
        if (res.status === 404) err = "The ask-claude function isn't deployed in Supabase yet.";
        throw new Error(err);
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "", pending = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf = parseSSE(buf + dec.decode(value, { stream: true }), (t) => { reply.content += t; });
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => { pending = false; const el = live(); if (el) el.innerHTML = renderMarkdown(reply.content); log.scrollTop = log.scrollHeight; });
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") { reply.content += (reply.content ? "\n\n" : "") + `⚠️ ${err.message}`; toast?.("Claude couldn't answer"); }
    } finally {
      controller = null; setBusy(false);
      if (!reply.content) messages.pop();
      save(); draw();
    }
  }

  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
  root.querySelector("#chat-new").addEventListener("click", () => { if (controller) controller.abort(); messages = []; save(); draw(); input.focus(); });

  draw();
  return { focus: () => input.focus() };
}
