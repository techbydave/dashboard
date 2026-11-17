// "Needs you": fill in a blog draft's placeholders from the dashboard, add a photo, and publish.
// Talks to the blog-drafts Supabase Edge Function, which holds the GitHub token.

import { placeholders, fillDraft, b64ToText, photoName } from "./drafts.js";
import { fetchDraft, REPO } from "./content.js";
import { demoDraft } from "./demo.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SETUP_URL = "https://github.com/techbydave/dashboard#fill-in-drafts-from-the-dashboard";

// Shrink a photo to at most 1600px on its long side, as a JPEG, and return its base64.
async function jpegBase64(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function createDraftEditor({ demo, endpoint, getToken, toast, onSaved }) {
  const dlg = document.createElement("dialog");
  dlg.className = "sheet draft-sheet";
  dlg.setAttribute("aria-labelledby", "dr-title");
  document.body.appendChild(dlg);
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  let cur = null; // { draft, md, sha, list, photos: {i: {file, url}}, ready }

  async function api(action, body = {}) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    let data = {}; try { data = await res.json(); } catch {}
    if (res.status === 404 && !data.error) throw new Error("The blog-drafts function isn't deployed in Supabase yet.");
    if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`);
    return data;
  }

  async function open(draft) {
    cur = { draft, md: "", sha: "", list: [], photos: {}, ready: demo, done: false };
    dlg.innerHTML = `<div class="sheet-head"><h2 id="dr-title">${esc(draft.title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><p class="muted">Loading the draft…</p>`;
    dlg.showModal();
    try {
      if (demo) { cur.md = demoDraft(draft.title); cur.sha = "demo"; }
      else {
        const [d, r] = await Promise.all([fetchDraft(draft.file), api("ready").catch(() => ({ ready: false }))]);
        cur.md = b64ToText(d.base64); cur.sha = d.sha; cur.ready = r.ready;
      }
      cur.list = placeholders(cur.md);
      draw();
    } catch (err) {
      dlg.querySelector("p").outerHTML = `<p class="form-msg">${esc(err.message)}</p>`;
    }
  }

  function fieldHtml(p) {
    const id = `dr-${p.i}`;
    const head = `<label for="${id}">${esc(p.label)}</label>${p.hint ? `<p class="muted small dr-hint">${esc(p.hint)}</p>` : ""}`;
    if (p.kind === "verdict") {
      return `<div class="dr-field"><span class="dr-label">${esc(p.label)}</span><div class="seg dr-verdict" role="radiogroup" aria-label="Verdict">
        ${["BUY", "WAIT", "SKIP"].map((v) => `<label class="v-${v.toLowerCase()}"><input type="radio" name="${id}" value="${v}" data-i="${p.i}"><span>${v}</span></label>`).join("")}
      </div></div>`;
    }
    if (p.kind === "photo") {
      const ph = cur.photos[p.i];
      return `<div class="dr-field">${head.replace(`for="${id}"`, `for="${id}-file"`)}
        <div class="dr-photo">
          <label class="dr-drop ${ph ? "has" : ""}">${ph ? `<img src="${ph.url}" alt="">` : `<span>＋ Add a photo</span>`}<input id="${id}-file" type="file" accept="image/*" data-photo="${p.i}" hidden></label>
          <label class="dr-skip"><input type="checkbox" data-skip="${p.i}"> No photo for this one</label>
        </div></div>`;
    }
    if (p.kind === "line") return `<div class="dr-field">${head}<input id="${id}" data-i="${p.i}" maxlength="220" autocomplete="off"></div>`;
    return `<div class="dr-field">${head}<textarea id="${id}" data-i="${p.i}" rows="3" maxlength="4000"></textarea></div>`;
  }

  function draw() {
    const n = cur.list.length;
    const gh = `https://github.com/${REPO}/edit/main/drafts/${encodeURIComponent(cur.draft.file || "")}`;
    const setup = !cur.ready
      ? `<div class="dr-setup"><b>One-time setup needed to save from here.</b> Add a GitHub token in Supabase so the dashboard can write to your blog. <a href="${SETUP_URL}" target="_blank" rel="noopener">How (3 minutes)</a>. Until then, use “Edit on GitHub”.</div>`
      : "";
    dlg.innerHTML = `
      <form class="dr-form" novalidate>
        <div class="sheet-head"><h2 id="dr-title">${esc(cur.draft.title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
        ${n ? `<p class="muted">${n} thing${n === 1 ? "" : "s"} to add. Fill in what you can and save; it goes live once they're all done.</p>` : `<div class="dr-done"><b>✓ All filled in.</b> It goes live at the next 9:00am publish, or publish it now.</div>`}
        ${setup}
        <div class="dr-fields">${cur.list.map(fieldHtml).join("")}</div>
        <p class="form-msg" role="alert"></p>
        <div class="sheet-actions">
          <a class="btn ghost sm" href="${gh}" target="_blank" rel="noopener">Edit on GitHub</a>
          <span class="spacer"></span>
          ${n ? `<button class="btn primary" type="submit" ${cur.ready ? "" : "disabled"}>Save</button>`
              : `<button class="btn ghost" type="button" data-close>Close</button><button class="btn primary" type="button" data-publish ${cur.ready ? "" : "disabled"}>Publish now</button>`}
        </div>
      </form>`;
    const form = dlg.querySelector("form");
    form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
    form.addEventListener("change", async (e) => {
      const i = e.target.dataset.photo;
      if (i != null && e.target.files[0]) {
        const f = e.target.files[0];
        if (!/^image\//.test(f.type)) return msg("Pick a photo (JPG or PNG).");
        cur.photos[i] = { file: f, url: URL.createObjectURL(f) };
        const keep = collect(); draw(); restore(keep);
      }
      if (e.target.dataset.skip != null) dlg.querySelector(`[data-photo="${e.target.dataset.skip}"]`)?.closest(".dr-drop")?.classList.toggle("off", e.target.checked);
    });
    dlg.querySelector("[data-publish]")?.addEventListener("click", publish);
  }

  const msg = (t) => { const m = dlg.querySelector(".form-msg"); if (m) m.textContent = t; };

  // Keep typed answers when the form redraws (after picking a photo)
  function collect() {
    const v = {};
    dlg.querySelectorAll("[data-i]").forEach((el) => { if (el.type === "radio") { if (el.checked) v[el.dataset.i] = el.value; } else v[el.dataset.i] = el.value; });
    dlg.querySelectorAll("[data-skip]").forEach((el) => { v[`skip${el.dataset.skip}`] = el.checked; });
    return v;
  }
  function restore(v) {
    dlg.querySelectorAll("[data-i]").forEach((el) => { const x = v[el.dataset.i]; if (x == null) return; if (el.type === "radio") el.checked = el.value === x; else el.value = x; });
    dlg.querySelectorAll("[data-skip]").forEach((el) => { el.checked = !!v[`skip${el.dataset.skip}`]; });
  }

  async function save() {
    const v = collect();
    const answers = {}, images = [];
    let k = 0;
    for (const p of cur.list) {
      if (p.kind === "photo") {
        if (v[`skip${p.i}`]) answers[p.i] = { remove: true };
        else if (cur.photos[p.i]) {
          const name = photoName(cur.draft.file || cur.draft.title, ++k);
          answers[p.i] = { image: name, alt: cur.draft.title };
          images.push({ i: p.i, name });
        }
      } else if (v[p.i]?.trim()) answers[p.i] = { text: v[p.i] };
    }
    if (!Object.keys(answers).length) return msg("Fill in at least one thing first.");
    const btn = dlg.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Saving…"; msg("");
    try {
      const content = fillDraft(cur.md, answers);
      if (!demo) {
        const files = [];
        for (const im of images) files.push({ name: im.name, base64: await jpegBase64(cur.photos[im.i].file) });
        const r = await api("save", { path: `drafts/${cur.draft.file}`, sha: cur.sha, content, images: files });
        cur.sha = r.sha || cur.sha;
      }
      cur.md = content; cur.list = placeholders(content); cur.photos = {};
      onSaved?.(cur.draft, cur.list.length);
      toast?.(cur.list.length ? `Saved. ${cur.list.length} left.` : "Saved. All done!");
      draw();
      if (cur.list.length) restore({});
    } catch (err) {
      btn.disabled = false; btn.textContent = "Save"; msg(err.message);
    }
  }

  async function publish() {
    const b = dlg.querySelector("[data-publish]");
    b.disabled = true; b.textContent = "Starting…";
    try {
      if (!demo) await api("publish");
      toast?.("Publishing now. It'll be on your site in about 2 minutes.");
      dlg.close();
    } catch (err) { b.disabled = false; b.textContent = "Publish now"; msg(err.message); }
  }

  return { open };
}
