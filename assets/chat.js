// "TechByDave AI" chat page. Talks to the ask-claude Supabase Edge Function, which holds
// the API keys (Google Gemini, optionally Claude) and streams the reply back here.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KEY = "tbd-chat";
const MODEL_KEY = "tbd-ai-model";
const MAX_SAVED = 40;
export const MAX_ATTACH = 4;          // files per message
export const MAX_IMAGES_SENT = 24;    // pictures sent per request (screenshots + video frames)
const IMG_SIDE = 1568, FRAME_SIDE = 768;

export const MODELS = [
  ["gemini-flash-lite", "Gemini Flash-Lite", "Free, fast"],
  ["gemini-flash", "Gemini Flash", "Free, smarter but slower"],
  ["claude-sonnet-5-5", "Claude Sonnet 5.5", "Paid, needs Anthropic key"],
  ["claude-opus-5-5", "Claude Opus 5.5", "Paid, smartest"],
];

const SUGGESTIONS = [
  "📎 Attach a Short and ask: how do I make this better?",
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

// --- attachments: screenshots and videos -----------------------------------------
// Pictures are shrunk and sent as JPEG/PNG. Videos become evenly spaced frames (the AI sees the
// frames, not the sound), labelled with their time so it can say "at 0:12, cut…".
export function frameTimes(duration, max = 12) {
  const d = Number(duration);
  if (!isFinite(d) || d <= 0) return [0];
  const n = Math.max(1, Math.min(max, Math.round(d / 2.5)));
  if (n === 1) return [Math.min(0.5, d / 2)];
  return Array.from({ length: n }, (_, i) => Math.round((0.15 + (i * (d - 0.4)) / (n - 1)) * 100) / 100).map((t) => Math.min(t, Math.max(0, d - 0.05)));
}
export const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function toJpeg(source, w, h, side, quality = 0.85, type = "image/jpeg") {
  const k = Math.min(1, side / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext("2d");
  if (type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
  g.drawImage(source, 0, 0, c.width, c.height);
  const url = c.toDataURL(type, quality);
  return { media_type: type, data: url.slice(url.indexOf(",") + 1), url };
}

async function readImage(file) {
  const bmp = await createImageBitmap(file);
  // Screenshots keep sharp text as PNG when they're small enough; photos become JPEG.
  const png = file.type === "image/png" && bmp.width * bmp.height <= 1600 * 1200;
  const img = toJpeg(bmp, bmp.width, bmp.height, IMG_SIDE, 0.88, png ? "image/png" : "image/jpeg");
  return { kind: "image", name: file.name || "screenshot.png", thumb: toJpeg(bmp, bmp.width, bmp.height, 160, 0.7).url, images: [{ media_type: img.media_type, data: img.data }], note: "" };
}

function readVideo(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    const fail = () => { URL.revokeObjectURL(url); reject(new Error(`Couldn't read ${file.name}. Try an MP4.`)); };
    v.onerror = fail;
    v.onloadedmetadata = async () => {
      try {
        const times = frameTimes(v.duration);
        const frames = [];
        for (const t of times) {
          await new Promise((ok, bad) => { const to = setTimeout(() => bad(new Error("seek")), 8000); v.onseeked = () => { clearTimeout(to); ok(); }; v.currentTime = t; });
          frames.push(toJpeg(v, v.videoWidth, v.videoHeight, FRAME_SIDE, 0.8));
        }
        URL.revokeObjectURL(url);
        const dur = Math.round(v.duration);
        resolve({
          kind: "video", name: file.name, thumb: frames[Math.min(1, frames.length - 1)].url, duration: dur,
          images: frames.map((f) => ({ media_type: f.media_type, data: f.data })),
          note: `[Video "${file.name}": ${dur}s, ${v.videoWidth}x${v.videoHeight}. Attached as ${frames.length} still frames at ${times.map(clock).join(", ")} (frames only, no sound).]`,
        });
      } catch { fail(); }
    };
  });
}

export async function readAttachment(file) {
  if (/^image\//.test(file.type)) return readImage(file);
  if (/^video\//.test(file.type)) return readVideo(file);
  throw new Error(`${file.name}: attach a photo, screenshot or video.`);
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
    if (msg.type === "error") throw new Error(msg.error?.message || "The AI ran into an error.");
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
        <div class="chat-attach-row" id="chat-attach" hidden></div>
        <button class="chat-clip" type="button" id="chat-clip" aria-label="Attach a photo, screenshot or video"><svg viewBox="0 0 24 24"><path d="M21 11.5 12.6 20a5.2 5.2 0 0 1-7.4-7.4l8.5-8.5a3.5 3.5 0 0 1 4.9 4.9l-8.5 8.5a1.7 1.7 0 0 1-2.5-2.5l7.8-7.8"/></svg></button>
        <input type="file" id="chat-file" accept="image/*,video/*" multiple hidden>
        <textarea id="chat-input" rows="1" placeholder="Ask anything, or attach a screenshot or video…" aria-label="Message TechByDave AI"></textarea>
        <button class="chat-send" type="submit" id="chat-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </form>
      <p class="chat-foot muted">TechByDave AI can make mistakes, so double-check anything important.</p>
    </div>`;

  const log = root.querySelector("#chat-log"), form = root.querySelector("#chat-form"), input = root.querySelector("#chat-input");
  const send = root.querySelector("#chat-send"), sel = root.querySelector("#chat-model");
  sel.value = MODELS.some((m) => m[0] === model) ? model : MODELS[0][0];
  sel.addEventListener("change", () => { model = sel.value; lsSet(MODEL_KEY, model); });

  // Full pictures stay in memory for this visit only; saved chats keep a small thumbnail.
  const save = () => lsSet(KEY, messages.slice(-MAX_SAVED).map(({ images, ...m }) => m));
  let pending = []; // attachments waiting to be sent
  const attachHtml = (list) => list?.length ? `<div class="msg-files">${list.map((a) =>
    `<figure class="msg-file ${a.kind}"><img src="${a.thumb}" alt="">${a.kind === "video" ? `<figcaption>▶ ${clock(a.duration || 0)}</figcaption>` : ""}</figure>`).join("")}</div>` : "";
  const bubble = (m) => `<div class="msg ${m.role}">${m.role === "assistant"
    ? `<div class="msg-avatar" aria-hidden="true"><span class="beacon-dot"></span></div><div class="msg-body">${m.content ? renderMarkdown(m.content) : '<span class="typing"><i></i><i></i><i></i></span>'}</div>`
    : `<div class="msg-body">${attachHtml(m.files)}${m.content ? esc(m.content).replace(/\n/g, "<br>") : ""}</div>`}</div>`;

  function draw() {
    if (!messages.length) {
      log.innerHTML = `<div class="chat-empty">
        <div class="chat-mark" aria-hidden="true"><span class="beacon-dot"></span></div>
        <h2>TechBy<span class="hl">Dave</span> AI</h2>
        <p class="muted">Your assistant that knows your brand and sees your dashboard numbers. Ask about growth, content ideas, pitches, anything.</p>
        <div class="chat-suggest">${SUGGESTIONS.map((s) => `<button type="button" class="suggest">${esc(s)}</button>`).join("")}</div>
      </div>`;
      log.querySelectorAll(".suggest").forEach((b) => b.addEventListener("click", () => {
        if (b.textContent.startsWith("📎")) { input.value = "How do I make this Short better? Hook, pacing, captions and cover."; autosize(); fileIn.click(); return; }
        input.value = b.textContent; submit();
      }));
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

  const tray = root.querySelector("#chat-attach"), fileIn = root.querySelector("#chat-file");
  function drawTray() {
    tray.hidden = !pending.length;
    tray.innerHTML = pending.map((a, i) => `<div class="chip-file ${a.busy ? "busy" : ""}">${a.thumb ? `<img src="${a.thumb}" alt="">` : "<span class='spin'></span>"}
      <span>${esc(a.busy ? "Reading…" : a.kind === "video" ? `${clock(a.duration || 0)} · ${a.images.length} frames` : "Photo")}</span>
      <button type="button" data-rm="${i}" aria-label="Remove ${esc(a.name)}">×</button></div>`).join("");
  }
  async function addFiles(files) {
    for (const f of [...files]) {
      if (pending.length >= MAX_ATTACH) { toast?.(`Up to ${MAX_ATTACH} files per message.`); break; }
      const slot = { busy: true, name: f.name, kind: /^video/.test(f.type) ? "video" : "image" };
      pending.push(slot); drawTray();
      try { Object.assign(slot, await readAttachment(f), { busy: false }); }
      catch (err) { pending = pending.filter((x) => x !== slot); toast?.(err.message); }
      drawTray();
    }
  }
  root.querySelector("#chat-clip").addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", () => { addFiles(fileIn.files); fileIn.value = ""; });
  tray.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { pending.splice(Number(b.dataset.rm), 1); drawTray(); } });
  input.addEventListener("paste", (e) => { const files = [...(e.clipboardData?.files || [])]; if (files.length) { e.preventDefault(); addFiles(files); } });
  root.querySelector(".chat").addEventListener("dragover", (e) => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); form.classList.add("drop"); } });
  root.querySelector(".chat").addEventListener("dragleave", (e) => { if (!e.relatedTarget || !root.contains(e.relatedTarget)) form.classList.remove("drop"); });
  root.querySelector(".chat").addEventListener("drop", (e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); form.classList.remove("drop"); addFiles(e.dataTransfer.files); } });

  // What goes to the server: text plus pictures, newest pictures first if there are too many.
  function payload(list) {
    let budget = MAX_IMAGES_SENT;
    const out = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      const msg = { role: m.role, content: m.content || "" };
      if (m.role === "user" && m.files?.length) {
        const notes = m.files.map((f) => f.note).filter(Boolean).join("\n");
        const imgs = (m.images || []).slice(0, Math.max(0, budget));
        budget -= imgs.length;
        if (imgs.length) msg.images = imgs;
        else msg.content = `[${m.files.length} attachment(s) from earlier, no longer available]\n` + msg.content;
        if (notes) msg.content = notes + (msg.content ? "\n\n" + msg.content : "");
        if (!msg.content.trim()) msg.content = "(see attachment)";
      }
      out.unshift(msg);
    }
    return out;
  }

  async function submit() {
    if (controller) { controller.abort(); return; }
    if (pending.some((a) => a.busy)) { toast?.("Still reading your file…"); return; }
    const text = input.value.trim();
    if (!text && !pending.length) return;
    input.value = ""; autosize();
    const files = pending.map(({ kind, name, thumb, duration, note }) => ({ kind, name, thumb, duration, note }));
    const images = pending.flatMap((a) => a.images);
    pending = []; drawTray();
    messages.push(files.length ? { role: "user", content: text, files, images } : { role: "user", content: text });
    const reply = { role: "assistant", content: "" };
    messages.push(reply);
    draw();
    const live = () => log.lastElementChild?.querySelector(".msg-body");

    if (demo) {
      reply.content = files.length
        ? `This is the demo, so I'm not connected yet, but I got your ${files.length === 1 ? files[0].kind : "files"}. Once you're signed in, I'll look at screenshots and video frames and tell you what to change.`
        : "This is the demo, so I'm not connected yet. Once your free Gemini key is added in Supabase, I'll answer here using your real dashboard numbers.";
      live().innerHTML = renderMarkdown(reply.content); save(); return;
    }

    controller = new AbortController(); setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, context: getContext(), messages: payload(messages.slice(0, -1)) }),
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
      if (err.name !== "AbortError") { reply.content += (reply.content ? "\n\n" : "") + `⚠️ ${err.message}`; toast?.("TechByDave AI couldn't answer"); }
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
