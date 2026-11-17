// Filling in blog drafts from the dashboard.
// The daily generator leaves "[[ADD YOUR SOMETHING: hint]]" placeholders in each draft. A draft only
// goes live once they're all gone (scripts/publish_drafts.py in the blog repo), so this module finds
// them, labels them, and writes Dave's answers back into the markdown.

const MARKER_RE = /\[\[ADD YOUR ([A-Z ]+):([\s\S]*?)\]\]/g;

const LABELS = {
  TAKE: "Your take", HOOK: "Opening", STORY: "Your story", ROUTINE: "How you use it", PROS: "What's great",
  CONS: "What's not", SNIPPET: "One-line summary", VERDICT: "Verdict", "VERDICT LINE": "Verdict in one sentence",
  "BUY IF": "Buy it if…", "WAIT IF": "Wait if…", "SKIP IF": "Skip it if…", PHOTO: "Photo",
};
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function frontmatterEnd(md) {
  const m = String(md).match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  return m ? m[0].length : 0;
}

// Every placeholder, in order: { i, marker, name, label, hint, kind, field, start, end }
// kind: "photo" | "verdict" | "line" (frontmatter, one line) | "text"
export function placeholders(md) {
  const text = String(md ?? "");
  const fmEnd = frontmatterEnd(text);
  const out = [];
  for (const m of text.matchAll(MARKER_RE)) {
    const name = m[1].trim();
    const start = m.index, end = m.index + m[0].length;
    const inFm = start < fmEnd;
    let field = null;
    if (inFm) {
      const lineStart = text.lastIndexOf("\n", start) + 1;
      const k = text.slice(lineStart, start).match(/^([A-Za-z_]+):\s*$/);
      field = k ? k[1].toLowerCase() : null;
    }
    const kind = name === "PHOTO" ? "photo" : name === "VERDICT" ? "verdict" : inFm ? "line" : "text";
    out.push({ i: out.length, marker: m[0], name, label: LABELS[name] || titleCase(name), hint: m[2].trim().replace(/\s*Delete this whole line when done\.?$/i, ""),
      kind, field, inFrontmatter: inFm, start, end });
  }
  return out;
}

export const todoCount = (md) => placeholders(md).length;

const imageName = (s) => String(s).split("/").pop();

// answers[i] = { text } to fill a placeholder, { remove: true } to drop it (e.g. no photo),
// { image: "file.jpg", alt } for a photo already in images/. Anything else stays as is.
export function fillDraft(md, answers = {}) {
  let text = String(md ?? "");
  const list = placeholders(text);
  // Work from the end so earlier positions stay valid.
  for (const p of [...list].reverse()) {
    const a = answers[p.i];
    if (!a) continue;
    let replacement = null, removeLine = false;
    if (a.remove) removeLine = true;
    else if (a.image) {
      const file = imageName(a.image);
      replacement = p.inFrontmatter ? file : `![${(a.alt || "Photo").replace(/[\[\]]/g, "")}](../images/${file})`;
    } else if (typeof a.text === "string" && a.text.trim()) {
      let t = a.text.trim();
      if (p.kind === "verdict") t = t.toUpperCase();
      if (p.inFrontmatter) t = t.replace(/\s+/g, " ");
      replacement = t;
    }
    if (removeLine) {
      const ls = text.lastIndexOf("\n", p.start) + 1;
      let le = text.indexOf("\n", p.end); if (le === -1) le = text.length; else le += 1;
      const before = text.slice(ls, p.start).trim(), after = text.slice(p.end, le).trim();
      // Drop the whole line when it holds only this placeholder (or "key: placeholder" in the frontmatter).
      if (!after && (!before || (p.inFrontmatter && /^[A-Za-z_]+:$/.test(before)))) text = text.slice(0, ls) + text.slice(le);
      else text = text.slice(0, p.start) + text.slice(p.end);
    } else if (replacement != null) {
      text = text.slice(0, p.start) + replacement + text.slice(p.end);
    }
  }
  return text.replace(/\n{3,}/g, "\n\n");
}

// "2026-11-14-iphone-15-plus-review.md" -> "iphone-15-plus-review-2.jpg" style names for uploaded photos
export function photoName(draftFile, n = 1, ext = "jpg") {
  const slug = String(draftFile).replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 50).replace(/-+$/, "");
  return `${slug || "photo"}-${Date.now().toString(36)}${n > 1 ? "-" + n : ""}.${ext}`;
}

// Base64 helpers that keep UTF-8 (emoji, curly quotes) intact.
export function b64ToText(b64) {
  const bin = atob(String(b64).replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
export function textToB64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
