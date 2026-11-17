// Notes: a simple notebook inside the dashboard. Markdown in, nicely formatted out, with a Copy button
// on every code block (handy for DMs and captions you paste into apps). Saves on its own as you type.

import { renderMarkdown } from "./chat.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Pinned first, then most recently edited
export function sortNotes(list) {
  return [...(list ?? [])].sort((a, b) => (b.pinned === true) - (a.pinned === true) || String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
}

// One-line preview for the list: first non-heading text, without Markdown symbols
export function snippet(body, max = 90) {
  const line = String(body ?? "").split("\n").map((l) => l.trim()).find((l) => l && !/^#{1,6}\s|^```|^---$/.test(l)) || "";
  const clean = line.replace(/[*_`>#]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

export function createNotes({ root, store, toast, uid }) {
  let notes = [], current = null, mode = "read", saveT = null, dirty = false;

  root.innerHTML = `
    <div class="notes">
      <aside class="panel notes-list">
        <div class="notes-head"><input type="search" id="notes-q" placeholder="Search notes" aria-label="Search notes">
          <button class="btn primary sm" type="button" id="notes-new"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New</button></div>
        <div id="notes-items" class="notes-items"></div>
      </aside>
      <article class="panel notes-doc" id="notes-doc"></article>
    </div>`;
  const $ = (s) => root.querySelector(s);

  async function load() {
    try { notes = sortNotes(await store.notes()); }
    catch (err) { notes = []; toast?.(err.message); }
    if (!current && notes.length && matchMedia("(min-width: 861px)").matches) current = notes[0];
    drawList(); drawDoc();
  }

  function drawList() {
    const q = $("#notes-q").value.trim().toLowerCase();
    const list = notes.filter((n) => !q || `${n.title}\n${n.body}`.toLowerCase().includes(q));
    $("#notes-items").innerHTML = list.length ? list.map((n) => `
      <button class="note-row ${current?.id === n.id ? "on" : ""}" data-note="${esc(n.id)}">
        <b>${n.pinned ? '<span class="pin" aria-label="Pinned">📌</span>' : ""}${esc(n.title || "Untitled")}</b>
        <span class="muted small">${esc(snippet(n.body))}</span>
      </button>`).join("")
      : `<p class="muted small">${q ? "No notes match." : "No notes yet. Tap New to start one."}</p>`;
    root.querySelector(".notes").classList.toggle("has-doc", !!current);
  }

  function addCopyButtons(el) {
    el.querySelectorAll("pre").forEach((pre) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "copy-btn"; b.textContent = "Copy";
      b.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? pre.textContent); b.textContent = "Copied ✓"; }
        catch { b.textContent = "Select and copy"; }
        setTimeout(() => (b.textContent = "Copy"), 1600);
      });
      pre.appendChild(b);
    });
  }

  function drawDoc() {
    const doc = $("#notes-doc");
    if (!current) { doc.innerHTML = `<div class="empty-mini notes-empty"><b>Pick a note or start a new one.</b><span class="muted">Notes support simple formatting: **bold**, lists, # headings and \`\`\` blocks with a Copy button.</span></div>`; return; }
    const when = current.updated_at ? new Date(current.updated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
    doc.innerHTML = `
      <div class="notes-bar">
        <button class="icon-btn notes-back" type="button" aria-label="Back to notes"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="seg" role="tablist"><button type="button" data-mode="read" aria-checked="${mode === "read"}">Read</button><button type="button" data-mode="edit" aria-checked="${mode === "edit"}">Edit</button></div>
        <span class="muted small notes-state" id="notes-state">${dirty ? "Saving…" : when ? `Saved ${when}` : ""}</span>
        <button class="icon-btn" type="button" id="note-pin" aria-label="${current.pinned ? "Unpin" : "Pin"}" title="${current.pinned ? "Unpin" : "Pin to top"}">📌</button>
        <button class="btn danger ghost sm" type="button" id="note-del">Delete</button>
      </div>
      ${mode === "edit"
        ? `<input class="note-title-in" id="note-title" maxlength="160" placeholder="Title" value="${esc(current.title)}">
           <textarea class="note-body-in" id="note-body" placeholder="Write anything… (# heading, - list, **bold**, \`\`\` for a copyable block)">${esc(current.body)}</textarea>`
        : `<h2 class="note-title">${esc(current.title || "Untitled")}</h2><div class="note-body msg-body">${current.body ? renderMarkdown(current.body) : '<p class="muted">Empty note. Tap Edit to write.</p>'}</div>`}`;
    doc.querySelector("#note-pin").classList.toggle("on", !!current.pinned);
    if (mode === "read") addCopyButtons(doc);
  }

  async function persist() {
    if (!current) return;
    clearTimeout(saveT); saveT = null;
    const n = { ...current, title: (current.title || "").slice(0, 160), updated_at: new Date().toISOString() };
    try {
      const saved = await store.saveNote(n);
      Object.assign(current, saved);
      const i = notes.findIndex((x) => x.id === saved.id);
      if (i >= 0) notes[i] = current; else notes.unshift(current);
      dirty = false;
      const st = $("#notes-state"); if (st) st.textContent = "Saved just now";
      notes = sortNotes(notes); drawList();
    } catch (err) { const st = $("#notes-state"); if (st) st.textContent = "Couldn't save"; toast?.(err.message); }
  }
  function queueSave() { dirty = true; const st = $("#notes-state"); if (st) st.textContent = "Saving…"; clearTimeout(saveT); saveT = setTimeout(persist, 900); }

  root.addEventListener("click", async (e) => {
    const t = e.target;
    const row = t.closest("[data-note]");
    if (row) { if (saveT) await persist(); current = notes.find((n) => n.id === row.dataset.note) || null; mode = "read"; drawList(); drawDoc(); return; }
    if (t.closest("#notes-new")) {
      if (saveT) await persist();
      current = { id: uid(), title: "", body: "", pinned: false, created_at: new Date().toISOString() };
      mode = "edit"; drawList(); drawDoc(); $("#note-title")?.focus(); return;
    }
    const m = t.closest("[data-mode]");
    if (m) { if (saveT) await persist(); mode = m.dataset.mode; drawDoc(); if (mode === "edit") $("#note-body")?.focus(); return; }
    if (t.closest(".notes-back")) { if (saveT) await persist(); current = null; drawList(); drawDoc(); return; }
    if (t.closest("#note-pin")) { current.pinned = !current.pinned; await persist(); drawDoc(); return; }
    const del = t.closest("#note-del");
    if (del) {
      if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = "Tap again to delete"; return; }
      clearTimeout(saveT); saveT = null;
      try {
        if (notes.some((n) => n.id === current.id)) await store.deleteNote(current.id);
        notes = notes.filter((n) => n.id !== current.id); current = null; drawList(); drawDoc(); toast?.("Note deleted");
      } catch (err) { toast?.(err.message); }
    }
  });
  root.addEventListener("input", (e) => {
    if (!current) return;
    if (e.target.id === "note-title") { current.title = e.target.value; queueSave(); }
    if (e.target.id === "note-body") { current.body = e.target.value; queueSave(); }
    if (e.target.id === "notes-q") drawList();
  });
  window.addEventListener("beforeunload", () => { if (saveT) persist(); });

  load();
  return { reload: load };
}
