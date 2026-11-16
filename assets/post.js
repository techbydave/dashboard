// "Post" page: upload a photo or video, pick social accounts, get AI-suggested titles, captions and
// hashtags per platform, then publish now or schedule. Talks to the social-post Supabase Edge Function,
// which holds the Zernio and Gemini keys.

import { logoTile } from "./logos.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const PLATFORM_INFO = {
  instagram: { name: "Instagram", logo: "instagram", limit: 2200 },
  tiktok: { name: "TikTok", logo: "tiktok", limit: 2200 },
  youtube: { name: "YouTube", logo: "youtube", limit: 5000, title: 100 },
  twitter: { name: "X", logo: "x", limit: 280 },
  pinterest: { name: "Pinterest", logo: "pinterest", limit: 500, title: 100 },
  facebook: { name: "Facebook", logo: "facebook", limit: 63206 },
  threads: { name: "Threads", logo: "threads", limit: 500 },
  linkedin: { name: "LinkedIn", logo: "linkedin", limit: 3000 },
  bluesky: { name: "Bluesky", logo: "bluesky", limit: 300 },
};
const ORDER = ["instagram", "tiktok", "youtube", "twitter", "pinterest", "facebook", "threads", "linkedin", "bluesky"];
const PRIVACY_LABELS = {
  PUBLIC_TO_EVERYONE: "Everyone", MUTUAL_FOLLOW_FRIENDS: "Friends", FOLLOWER_OF_CREATOR: "Followers", SELF_ONLY: "Only me",
};
const MAX_FALLBACK = 50 * 1024 * 1024;
const HANDLE = "techby_dave";
// Platforms that aren't connected get a "copy and paste" card: the page writes the text, Dave posts it himself.
// Add a platform here (e.g. twitter: "https://x.com/compose/post") to show it as a copy-and-paste card.
const MANUAL = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function withManual(accounts) {
  const out = [...accounts];
  for (const platform of Object.keys(MANUAL)) {
    if (!out.some((a) => a.platform === platform)) out.push({ id: `manual-${platform}`, platform, username: HANDLE, manual: true });
  }
  return out;
}

const tile = (platform) => {
  const info = PLATFORM_INFO[platform] ?? { name: platform, logo: platform };
  return logoTile({ id: info.logo, mono: info.name.slice(0, 2).toUpperCase() });
};

export const hashtagText = (raw = "") =>
  raw.split(/[\s,]+/).map((t) => t.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")).filter(Boolean)
    .filter((t, i, a) => a.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i).map((t) => `#${t}`).join(" ");

export const fullCaption = (f) => [f.caption?.trim() ?? "", hashtagText(f.hashtags)].filter(Boolean).join("\n\n");

/** Problems that would stop a post, per selected account. Pure, so it's easy to test. */
export function problems({ accounts, selected, fields, mediaType, when = "now" }) {
  const out = [];
  if (!mediaType) out.push("Add a photo or video.");
  if (!selected.length) out.push("Pick at least one account.");
  for (const id of selected) {
    const acc = accounts.find((a) => a.id === id); if (!acc) continue;
    const f = fields[id] ?? {}, info = PLATFORM_INFO[acc.platform] ?? {}, name = info.name ?? acc.platform;
    const text = fullCaption(f);
    if (acc.direct && when === "later") out.push(`${name} can only post right away from here. Choose Post now, or untick it.`);
    if (info.limit && text.length > info.limit) out.push(`${name}: caption is ${text.length - info.limit} characters too long.`);
    if (acc.platform === "youtube") {
      if (mediaType && mediaType !== "video") out.push("YouTube only takes videos.");
      if (!f.title?.trim()) out.push("YouTube needs a title.");
      else if (f.title.length > 100) out.push("YouTube title is over 100 characters.");
    }
    if (acc.platform === "pinterest" && !acc.manual && !f.boardId) out.push("Pick a Pinterest board.");
    if (acc.platform === "pinterest" && f.link && !/^https?:\/\//.test(f.link.trim())) out.push("Pinterest link must start with https://");
    if (acc.platform === "tiktok") {
      if (!f.privacy) out.push("Pick who can see the TikTok post.");
      if (!f.consent) out.push("Tick the TikTok consent box.");
    }
  }
  return out;
}

export function costNote(accounts, selected, fields) {
  const x = selected.map((id) => accounts.find((a) => a.id === id)).find((a) => a?.platform === "twitter" && !a.manual);
  if (!x) return "";
  const hasLink = /https?:\/\/|www\.|\.(com|ca|io|net|org)\b/i.test(fullCaption(fields[x.id] ?? {}));
  return hasLink ? "X charges $0.20 for a post with a link (vs $0.015 without). Remove the link to save." : "X charges about $0.015 per post.";
}

function captureFrame(file, type) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const done = (src) => {
      try {
        const scale = Math.min(1, 640 / Math.max(src.videoWidth || src.naturalWidth, src.videoHeight || src.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round((src.videoWidth || src.naturalWidth) * scale);
        c.height = Math.round((src.videoHeight || src.naturalHeight) * scale);
        c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.72));
      } catch { resolve(null); } finally { URL.revokeObjectURL(url); }
    };
    if (type === "video") {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
      v.addEventListener("loadeddata", () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); }, { once: true });
      v.addEventListener("seeked", () => done(v), { once: true });
      v.addEventListener("error", () => { URL.revokeObjectURL(url); resolve(null); }, { once: true });
      setTimeout(() => resolve(null), 8000);
    } else {
      const img = new Image();
      img.onload = () => done(img);
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    }
  });
}

function toJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => b ? resolve(new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })) : reject(new Error("Couldn't convert the photo to JPG.")), "image/jpeg", 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read the photo.")); };
    img.src = url;
  });
}

function putWithProgress(url, file, headers, onProgress, method = "PUT") {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

const DEMO_ACCOUNTS = [
  { id: "direct-instagram", platform: "instagram", username: HANDLE, direct: true },
  { id: "d-tt", platform: "tiktok", username: HANDLE },
  { id: "d-yt", platform: "youtube", username: HANDLE },
];

export function createPoster({ root, demo, endpoint, supabaseUrl, anonKey, getToken, toast }) {
  const st = {
    accounts: null, loadError: "", warnings: [], selected: [], fields: {}, boards: {}, tiktok: {},
    file: null, mediaType: null, preview: null, frame: null, about: "",
    when: "now", at: "", busy: "", progress: 0, result: null, recent: [], suggesting: false,
  };

  async function api(action, body = {}) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    let data = {}; try { data = await res.json(); } catch {}
    if (res.status === 404 && !data.error) throw new Error("The social-post function isn't deployed in Supabase yet.");
    if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`);
    return data;
  }

  const field = (id) => (st.fields[id] ??= { caption: "", title: "", hashtags: "", visibility: "public", allowComment: true, allowDuet: true, allowStitch: true });
  const acct = (id) => st.accounts?.find((a) => a.id === id);

  // ---------- loading ----------
  async function loadAccounts() {
    const sorted = (list) => withManual(list).sort((a, b) => ORDER.indexOf(a.platform) - ORDER.indexOf(b.platform));
    if (demo) { st.accounts = sorted(DEMO_ACCOUNTS); draw(); return; }
    try {
      const { accounts, warnings } = await api("accounts");
      st.accounts = sorted(accounts);
      st.warnings = warnings ?? [];
      st.loadError = "";
    } catch (err) { st.accounts = []; st.loadError = err.message; }
    draw();
    loadRecent();
  }
  async function loadRecent() {
    if (demo) return;
    try { st.recent = (await api("recent")).posts; drawRecent(); } catch { /* optional */ }
  }
  async function ensureExtras(id) {
    const a = acct(id); if (!a) return;
    if (a.manual || a.direct) { drawEditors(); return; }
    if (a.platform === "pinterest" && !st.boards[id]) {
      st.boards[id] = demo ? [{ id: "b1", name: "Gadgets worth it" }, { id: "b2", name: "Budget tech" }] : null;
      if (!demo) { try { st.boards[id] = (await api("boards", { accountId: id })).boards; } catch (err) { st.boards[id] = []; toast?.(err.message); } }
      if (st.boards[id]?.length === 1) field(id).boardId = st.boards[id][0].id;
    }
    if (a.platform === "tiktok" && !st.tiktok[id]) {
      st.tiktok[id] = demo ? { privacyOptions: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"] } : null;
      if (!demo) { try { st.tiktok[id] = await api("tiktok-info", { accountId: id }); } catch (err) { st.tiktok[id] = { privacyOptions: [] }; toast?.(err.message); } }
      const f = field(id), info = st.tiktok[id];
      if (info.commentDisabled) f.allowComment = false;
      if (info.duetDisabled) f.allowDuet = false;
      if (info.stitchDisabled) f.allowStitch = false;
    }
    drawEditors();
  }

  // ---------- actions ----------
  async function pickFile(file) {
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!type) { toast?.("Pick a photo or a video file."); return; }
    if (st.preview) URL.revokeObjectURL(st.preview);
    Object.assign(st, { file, mediaType: type, preview: URL.createObjectURL(file), frame: null, result: null });
    draw();
    st.frame = await captureFrame(file, type);
  }

  async function suggestAll() {
    const platforms = [...new Set(st.selected.map((id) => acct(id)?.platform).filter(Boolean))];
    if (!platforms.length) { toast?.("Pick your accounts first."); return; }
    st.suggesting = true; drawActions();
    try {
      let suggestions;
      if (demo) {
        await new Promise((r) => setTimeout(r, 600));
        suggestions = Object.fromEntries(platforms.map((p) => [p, {
          title: p === "youtube" || p === "pinterest" ? "iPhone 15 Plus in 2026: Worth It or a Waste?" : "",
          caption: p === "twitter" ? "Two years with the iPhone 15 Plus. Still worth it in 2026? My honest verdict 👇" : "I've used the iPhone 15 Plus for two years. Here's whether it's still worth buying in 2026.",
          hashtags: "#iphone15plus #apple #techbydave #worthit",
        }]));
      } else {
        ({ suggestions } = await api("suggest", { platforms, about: st.about, mediaType: st.mediaType, fileName: st.file?.name, frame: st.frame }));
      }
      for (const id of st.selected) {
        const s = suggestions[acct(id)?.platform]; if (!s) continue;
        const f = field(id);
        Object.assign(f, { caption: s.caption || f.caption, hashtags: s.hashtags || f.hashtags, title: s.title || f.title });
      }
      toast?.("Suggestions added. Edit anything you like.");
    } catch (err) { toast?.(err.message); }
    st.suggesting = false; drawEditors(); drawActions();
  }

  async function upload(forInstagram) {
    let f = st.file;
    const onProgress = (p) => { st.progress = p; drawActions(); };
    if (demo) { for (let i = 1; i <= 10; i++) { onProgress(i / 10); await sleep(50); } return "https://example.com/demo.mp4"; }
    // Instagram only accepts JPG photos, so convert PNG/WebP first.
    if (forInstagram && st.mediaType === "image" && f.type !== "image/jpeg") f = await toJpeg(f);
    try {
      const { uploadUrl, publicUrl } = await api("presign", { filename: f.name, contentType: f.type, size: f.size });
      await putWithProgress(uploadUrl, f, { "Content-Type": f.type }, onProgress);
      return publicUrl;
    } catch (err) {
      // Backup route: our own Supabase Storage bucket (admin-only uploads, public reads, 50 MB max).
      if (f.size > MAX_FALLBACK) throw new Error(err.message === "network" ? "Upload was blocked. Try a file under 50 MB." : err.message);
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]+/g, "_")}`;
      try {
        await putWithProgress(`${supabaseUrl}/storage/v1/object/social-media/${path}`, f,
          { Authorization: `Bearer ${await getToken()}`, apikey: anonKey, "Content-Type": f.type, "x-upsert": "false" }, onProgress, "POST");
      } catch { throw new Error(err.message === "network" ? "The upload didn't go through. Check your connection and try again." : err.message); }
      return `${supabaseUrl}/storage/v1/object/public/social-media/${path}`;
    }
  }

  const manualText = (a) => {
    const f = field(a.id);
    return [a.platform === "pinterest" ? f.title?.trim() : "", fullCaption(f)].filter(Boolean).join("\n\n");
  };

  function mergeZernio(r) {
    if (!st.result || !r.platforms?.length) return;
    st.result.platforms = [...r.platforms.map((p) => ({ ...p, source: "zernio" })), ...st.result.platforms.filter((e) => e.source !== "zernio")];
  }

  // Instagram through Dave's own Meta app: create the post, wait for Instagram to process it, then publish.
  async function postInstagram(a, url, entry) {
    try {
      entry.status = "processing"; drawActions();
      if (demo) { await sleep(500); entry.status = "published"; drawActions(); return; }
      const { containerId } = await api("ig-create", { mediaUrl: url, mediaType: st.mediaType, caption: fullCaption(field(a.id)) });
      for (let i = 0; ; i++) {
        const s = await api("ig-status", { containerId });
        if (s.status === "FINISHED") break;
        if (s.status === "ERROR" || s.status === "EXPIRED") throw new Error(`Instagram couldn't process the file${s.detail ? `: ${s.detail}` : "."}`);
        if (i >= 75) throw new Error("Instagram is still processing after 5 minutes. Check the Instagram app in a bit.");
        await sleep(4000);
      }
      const done = await api("ig-publish", { containerId });
      Object.assign(entry, { status: "published", url: done.url });
    } catch (err) { Object.assign(entry, { status: "failed", error: err.message }); }
    drawActions();
  }

  async function publish() {
    const issues = problems({ accounts: st.accounts ?? [], selected: st.selected, fields: st.fields, mediaType: st.mediaType, when: st.when });
    if (issues.length) { drawActions(issues); return; }
    if (st.when === "later" && !st.at) { drawActions(["Pick a date and time."]); return; }
    const picked = st.selected.map(acct).filter(Boolean);
    const viaZernio = picked.filter((a) => !a.direct && !a.manual), direct = picked.filter((a) => a.direct), manual = picked.filter((a) => a.manual);
    const when = st.when === "later" ? new Date(st.at).toISOString() : null;
    const entries = [
      ...viaZernio.map((a) => ({ key: a.id, source: "zernio", platform: a.platform, status: "pending" })),
      ...direct.map((a) => ({ key: a.id, source: "direct", platform: a.platform, status: "pending" })),
      ...manual.map((a) => ({ key: a.id, source: "manual", platform: a.platform, status: "copy", text: manualText(a), open: MANUAL[a.platform] })),
    ];
    st.result = null; st.progress = 0;
    try {
      let url = null;
      if (viaZernio.length || direct.length) { st.busy = "uploading"; drawActions(); url = await upload(direct.length > 0); }
      st.busy = "publishing"; st.result = { id: null, scheduledFor: when, platforms: entries }; drawActions();
      if (viaZernio.length) {
        try {
          const targets = viaZernio.map((a) => {
            const f = field(a.id);
            return { platform: a.platform, accountId: a.id, caption: f.caption, title: f.title, hashtags: f.hashtags, boardId: f.boardId,
              link: f.link, visibility: f.visibility, madeForKids: !!f.madeForKids, privacy: f.privacy,
              allowComment: f.allowComment, allowDuet: f.allowDuet, allowStitch: f.allowStitch, consent: !!f.consent, firstComment: f.firstComment };
          });
          const r = demo
            ? { id: "demo", platforms: targets.map((t) => ({ platform: t.platform, status: when ? "scheduled" : "published", url: null })) }
            : await api("publish", { targets, media: [{ url, type: st.mediaType }], when, description: st.about });
          st.result.id = r.id; mergeZernio(r);
        } catch (err) {
          st.result.platforms.filter((e) => e.source === "zernio").forEach((e) => Object.assign(e, { status: "failed", error: err.message }));
        }
        drawActions();
      }
      for (const a of direct) await postInstagram(a, url, st.result.platforms.find((e) => e.key === a.id));
      st.busy = ""; drawActions();
      toast?.(when ? "Scheduled!" : manual.length === picked.length ? "Text ready to copy." : "Posting…");
      if (!demo && !when && st.result.id) pollStatus(st.result.id);
      loadRecent();
    } catch (err) {
      st.busy = ""; st.result = null; drawActions([err.message]);
    }
  }

  async function pollStatus(id, tries = 0) {
    if (tries > 24) return;
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const r = await api("status", { postId: id });
      if (st.result?.id !== id) return;
      mergeZernio(r); drawActions();
      if (r.platforms.some((p) => ["pending", "publishing", "processing"].includes(p.status))) pollStatus(id, tries + 1);
      else loadRecent();
    } catch { pollStatus(id, tries + 1); }
  }

  function reset() {
    if (st.preview) URL.revokeObjectURL(st.preview);
    Object.assign(st, { file: null, mediaType: null, preview: null, frame: null, about: "", fields: {}, result: null, when: "now", at: "", progress: 0 });
    draw();
  }

  // ---------- drawing ----------
  function draw() {
    root.innerHTML = `
      <div class="pz">
          <div class="pz-panel pz-a-media">
            <h3>1. Your photo or video</h3>
            <label class="pz-drop ${st.preview ? "has" : ""}" id="pz-drop">
              <input type="file" id="pz-file" accept="image/*,video/*" hidden>
              ${st.preview
                ? (st.mediaType === "video" ? `<video src="${st.preview}" controls playsinline muted></video>` : `<img src="${st.preview}" alt="Your upload">`)
                : `<span class="pz-drop-icon" aria-hidden="true">⇪</span><b>Drop a photo or video here</b><span class="muted">or tap to choose · MP4, MOV, JPG, PNG</span>`}
            </label>
            ${st.file ? `<p class="muted pz-file">${esc(st.file.name)} · ${(st.file.size / 1048576).toFixed(1)} MB <button type="button" class="linkish" id="pz-clear">Change</button></p>` : ""}
            <label for="pz-about">What's it about? <span class="muted">(helps the AI)</span></label>
            <textarea id="pz-about" rows="3" placeholder="e.g. Quick look at the iPhone 15 Plus two years later. Verdict: still worth it on sale.">${esc(st.about)}</textarea>
          </div>
          <div class="pz-panel pz-a-accounts">
            <h3>2. Where to post</h3>
            <div id="pz-accounts">${accountsHtml()}</div>
          </div>
          <div class="pz-panel pz-a-editors">
            <div class="pz-head"><h3>3. Titles, captions & tags</h3>
              <button type="button" class="btn sm" id="pz-suggest">✦ Suggest with AI</button></div>
            <div id="pz-editors"></div>
          </div>
          <div class="pz-panel pz-a-actions" id="pz-actions"></div>
          <div class="pz-panel pz-a-recent" id="pz-recent-wrap" ${st.recent.length ? "" : "hidden"}><h3>Recent posts</h3><div id="pz-recent"></div></div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    const drop = $("#pz-drop"), input = $("#pz-file");
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); pickFile(e.dataTransfer.files[0]); });
    input.addEventListener("change", () => pickFile(input.files[0]));
    $("#pz-clear")?.addEventListener("click", (e) => { e.preventDefault(); input.click(); });
    $("#pz-about").addEventListener("input", (e) => { st.about = e.target.value; });
    $("#pz-suggest").addEventListener("click", suggestAll);
    root.querySelector("#pz-accounts").addEventListener("change", (e) => {
      const id = e.target.dataset.acc; if (!id) return;
      st.selected = e.target.checked ? [...st.selected, id] : st.selected.filter((x) => x !== id);
      e.target.closest(".pz-acc")?.classList.toggle("on", e.target.checked);
      if (e.target.checked) { field(id); ensureExtras(id); } else drawEditors();
      drawActions();
    });
    root.querySelector("#pz-accounts").addEventListener("click", (e) => { if (e.target.id === "pz-retry") { st.accounts = null; draw(); loadAccounts(); } });
    drawEditors(); drawActions(); drawRecent();
  }

  function accountsHtml() {
    if (st.accounts === null) return `<p class="muted">Loading your accounts…</p>`;
    if (st.loadError) return `<p class="pz-err">${esc(st.loadError)}</p><button type="button" class="btn sm" id="pz-retry">Try again</button>`;
    return `${st.warnings.length ? `<ul class="pz-warn">${st.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}<div class="pz-accs">${st.accounts.map((a) => `
      <label class="pz-acc ${st.selected.includes(a.id) ? "on" : ""}">
        <input type="checkbox" data-acc="${esc(a.id)}" ${st.selected.includes(a.id) ? "checked" : ""}>
        ${tile(a.platform)}
        <span><b>${esc(PLATFORM_INFO[a.platform]?.name ?? a.platform)}</b><small class="muted">${a.manual ? "copy & paste" : `@${esc(a.username || a.name)}`}</small></span>
      </label>`).join("")}</div>`;
  }

  function editorHtml(id) {
    const a = acct(id), f = field(id), info = PLATFORM_INFO[a.platform] ?? {}, len = fullCaption(f).length;
    const extra = [];
    if (a.platform === "youtube") extra.push(`
      <label>Title <span class="muted pz-count">${f.title.length}/100</span><input data-f="title" value="${esc(f.title)}" maxlength="100" placeholder="Hooky title with the product name"></label>
      <div class="pz-row"><label>Visibility<select data-f="visibility">${["public", "unlisted", "private"].map((v) => `<option ${f.visibility === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="pz-check"><input type="checkbox" data-f="madeForKids" ${f.madeForKids ? "checked" : ""}> Made for kids</label></div>`);
    if (a.platform === "pinterest" && a.manual) extra.push(`
      <label>Pin title<input data-f="title" value="${esc(f.title)}" maxlength="100" placeholder="Searchable title"></label>`);
    if (a.platform === "pinterest" && !a.manual) {
      const boards = st.boards[id];
      extra.push(`
      <label>Pin title<input data-f="title" value="${esc(f.title)}" maxlength="100" placeholder="Searchable title"></label>
      <div class="pz-row"><label>Board<select data-f="boardId">${boards === null || boards === undefined ? `<option>Loading…</option>` : `<option value="">Pick a board</option>${boards.map((b) => `<option value="${esc(b.id)}" ${f.boardId === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}`}</select></label>
      <label>Link <span class="muted">(optional)</span><input data-f="link" value="${esc(f.link ?? "")}" placeholder="https://techbydave.com/..."></label></div>`);
    }
    if (a.platform === "tiktok") {
      const t = st.tiktok[id];
      extra.push(`
      <div class="pz-row"><label>Who can see it<select data-f="privacy"><option value="">Choose…</option>${(t?.privacyOptions ?? []).map((o) => `<option value="${esc(o)}" ${f.privacy === o ? "selected" : ""}>${esc(PRIVACY_LABELS[o] ?? o)}</option>`).join("")}</select></label>
      <div class="pz-checks">
        <label class="pz-check"><input type="checkbox" data-f="allowComment" ${f.allowComment ? "checked" : ""} ${t?.commentDisabled ? "disabled" : ""}> Comments</label>
        ${st.mediaType !== "image" ? `<label class="pz-check"><input type="checkbox" data-f="allowDuet" ${f.allowDuet ? "checked" : ""} ${t?.duetDisabled ? "disabled" : ""}> Duet</label>
        <label class="pz-check"><input type="checkbox" data-f="allowStitch" ${f.allowStitch ? "checked" : ""} ${t?.stitchDisabled ? "disabled" : ""}> Stitch</label>` : ""}
      </div></div>
      <label class="pz-check pz-consent"><input type="checkbox" data-f="consent" ${f.consent ? "checked" : ""}><span>I've previewed this post and agree to TikTok's <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener">Music Usage Confirmation</a>.</span></label>`);
    }
    if (!a.direct && !a.manual && ["instagram", "youtube", "facebook", "linkedin"].includes(a.platform)) extra.push(`
      <label>First comment <span class="muted">(optional, good for links)</span><input data-f="firstComment" value="${esc(f.firstComment ?? "")}" placeholder="Full review: techbydave.com"></label>`);
    return `
      <details class="pz-ed" data-id="${esc(id)}" open>
        <summary>${tile(a.platform)}<b>${esc(info.name ?? a.platform)}</b><span class="muted">${a.manual ? "copy & paste" : `@${esc(a.username || a.name)}`}</span>
          <span class="pz-count ${info.limit && len > info.limit ? "over" : ""}">${len}${info.limit ? `/${info.limit}` : ""}</span></summary>
        ${a.manual ? `<p class="muted pz-manual">${esc(info.name)} isn't connected, so you post this one yourself. After you tap Post, you get this text to copy.</p>` : ""}
        <label>${a.platform === "youtube" ? "Description" : "Caption"}<textarea data-f="caption" rows="${a.platform === "twitter" ? 3 : 4}">${esc(f.caption)}</textarea></label>
        <label>Hashtags<input data-f="hashtags" value="${esc(f.hashtags)}" placeholder="#techbydave #gadgets"></label>
        ${extra.join("")}
      </details>`;
  }

  function drawEditors() {
    const box = root.querySelector("#pz-editors"); if (!box) return;
    box.innerHTML = st.selected.length ? st.selected.filter(acct).map(editorHtml).join("")
      : `<p class="muted">Pick accounts on the left, then tap <b>Suggest with AI</b> for titles, captions and hashtags made for each platform.</p>`;
    box.oninput = box.onchange = (e) => {
      const ed = e.target.closest(".pz-ed"), key = e.target.dataset.f; if (!ed || !key) return;
      const f = field(ed.dataset.id);
      f[key] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      const a = acct(ed.dataset.id), info = PLATFORM_INFO[a.platform] ?? {}, len = fullCaption(f).length;
      const c = ed.querySelector("summary .pz-count"); c.textContent = `${len}${info.limit ? `/${info.limit}` : ""}`; c.classList.toggle("over", !!info.limit && len > info.limit);
      if (key === "title") { const t = ed.querySelector("label .pz-count"); if (t) t.textContent = `${f.title.length}/100`; }
      if (e.type === "change" || key === "caption") drawActions();
    };
  }

  function drawActions(errors = []) {
    const box = root.querySelector("#pz-actions"); if (!box) return;
    const sug = root.querySelector("#pz-suggest");
    if (sug) { sug.disabled = st.suggesting; sug.textContent = st.suggesting ? "Thinking…" : "✦ Suggest with AI"; }
    const cost = costNote(st.accounts ?? [], st.selected, st.fields);
    const busy = st.busy === "uploading" ? `Uploading… ${Math.round(st.progress * 100)}%` : st.busy === "publishing" ? "Publishing…" : "";
    const r = st.result;
    box.innerHTML = `
      <h3>4. Post it</h3>
      <div class="pz-when">
        <label class="pz-check"><input type="radio" name="pz-when" value="now" ${st.when === "now" ? "checked" : ""}> Post now</label>
        <label class="pz-check"><input type="radio" name="pz-when" value="later" ${st.when === "later" ? "checked" : ""}> Schedule</label>
        ${st.when === "later" ? `<input type="datetime-local" id="pz-at" value="${esc(st.at)}">` : ""}
      </div>
      ${cost ? `<p class="muted pz-note">💲 ${esc(cost)}</p>` : ""}
      ${errors.length ? `<ul class="pz-err">${errors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${busy ? `<div class="pz-progress"><i style="width:${st.busy === "uploading" ? Math.round(st.progress * 100) : 100}%"></i></div><p class="muted">${busy}</p>` : ""}
      <button type="button" class="btn primary block" id="pz-go" ${st.busy ? "disabled" : ""}>${st.when === "later" ? "Schedule post" : "Post now"}${st.selected.length ? ` to ${st.selected.length} account${st.selected.length > 1 ? "s" : ""}` : ""}</button>
      ${r ? `<div class="pz-result">
        <b>${r.scheduledFor ? `Scheduled for ${esc(new Date(r.scheduledFor).toLocaleString())}` : "Post status"}</b>
        <ul>${r.platforms.map((p, i) => { const name = esc(PLATFORM_INFO[p.platform]?.name ?? p.platform); return `<li>${tile(p.platform)}<span>${name}</span>
          ${p.source === "manual"
            ? `<button type="button" class="btn sm" data-copy="${i}">Copy text</button> <a href="${esc(p.open)}" target="_blank" rel="noopener">Open ${name} ↗</a>`
            : `<span class="pz-pill s-${esc(p.status)}">${esc(p.status)}</span>${p.url ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener">View ↗</a>` : ""}`}
          ${p.error ? `<small class="pz-err">${esc(p.error)}</small>` : ""}</li>`; }).join("")}</ul>
        ${st.busy ? "" : `<button type="button" class="btn sm" id="pz-new">Start a new post</button>`}</div>` : ""}`;
    box.querySelectorAll("[data-copy]").forEach((el) => el.addEventListener("click", async () => {
      const text = st.result?.platforms[Number(el.dataset.copy)]?.text ?? "";
      try { await navigator.clipboard.writeText(text); el.textContent = "Copied ✓"; } catch { toast?.("Couldn't copy. Select the text in the box above instead."); }
    }));
    box.querySelectorAll('input[name="pz-when"]').forEach((el) => el.addEventListener("change", () => { st.when = el.value; drawActions(); }));
    box.querySelector("#pz-at")?.addEventListener("change", (e) => { st.at = e.target.value; });
    box.querySelector("#pz-go").addEventListener("click", publish);
    box.querySelector("#pz-new")?.addEventListener("click", reset);
  }

  function drawRecent() {
    const wrap = root.querySelector("#pz-recent-wrap"), box = root.querySelector("#pz-recent"); if (!box) return;
    wrap.hidden = !st.recent.length;
    box.innerHTML = st.recent.map((p) => `
      <div class="pz-recent">
        <div class="pz-recent-top"><span class="pz-pill s-${esc(p.status)}">${esc(p.status)}</span>
          <span class="muted">${esc(new Date(p.scheduledFor || p.createdAt || Date.now()).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</span></div>
        <p>${esc(p.content || "(no caption)")}</p>
        <div class="pz-recent-plats">${p.platforms.map((x) => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.status)}">${tile(x.platform)}</a>` : `<span title="${esc(x.status)}">${tile(x.platform)}</span>`).join("")}</div>
      </div>`).join("");
  }

  draw();
  loadAccounts();
  return { refresh: loadAccounts };
}
