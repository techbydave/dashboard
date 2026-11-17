// "Learn to code" view: today's lesson, a tick-off checklist per week, streak and progress.
import { PHASES, WEEKS, TOTAL, LEARN_START, sessionDate, session, currentSession, streak, missed, phaseProgress } from "./learn-plan.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (iso, o) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { timeZone: "UTC", ...o });
const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const daysUntil = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

export function createLearn({ root, store, toast, onChange }) {
  let done = new Set();
  let today = LEARN_START;
  let loaded = false;

  const checkBtn = (date, label) => {
    const on = done.has(date);
    return `<button class="check" type="button" data-learn="${date}" aria-pressed="${on}" aria-label="${on ? "Mark not done" : "Mark done"}: ${esc(label)}">${CHECK}</button>`;
  };
  const links = (list) => list.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join("");

  function statsHtml() {
    const count = done.size;
    const pct = Math.round((count / TOTAL) * 100);
    const s = streak([...done], today);
    const cur = session(currentSession(today));
    const before = today < LEARN_START;
    return `
      <div class="ln-stat"><span class="ln-k">Progress</span><b>${count}<small>/${TOTAL}</small></b>
        <div class="ln-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="${count}" aria-label="Sessions done"><i style="width:${pct}%"></i></div><span class="muted small">${pct}% of the plan</span></div>
      <div class="ln-stat"><span class="ln-k">Streak</span><b>${s ? "🔥 " : ""}${s}<small> day${s === 1 ? "" : "s"}</small></b><span class="muted small">${s ? "Keep it going" : before ? "Starts Monday" : "Tick today's lesson to start one"}</span></div>
      <div class="ln-stat"><span class="ln-k">${before ? "First up" : "Now learning"}</span><b class="ln-phase" style="--pc:${cur.phase.color}">${esc(cur.phase.name)}</b><span class="muted small">Week ${cur.week} of ${WEEKS.length}</span></div>`;
  }

  function stripHtml() {
    const cur = session(currentSession(today));
    return PHASES.map((p) => {
      const pr = phaseProgress(p, [...done]);
      const w = p.weeks[1] - p.weeks[0] + 1;
      return `<a class="ln-seg${p.key === cur.phase.key ? " now" : ""}" href="#ln-${p.key}" style="--pc:${p.color};flex:${w}" title="${esc(p.name)}: ${pr.done}/${pr.total}">
        <span>${esc(p.name)}</span><i><em style="width:${Math.round((pr.done / pr.total) * 100)}%"></em></i></a>`;
    }).join("");
  }

  function todayHtml() {
    const before = today < LEARN_START;
    const s = session(currentSession(today));
    const isToday = s.date === today;
    const when = before ? `Starts ${fmt(LEARN_START, { weekday: "long", month: "short", day: "numeric" })} · ${daysUntil(today, LEARN_START)} days to go`
      : isToday ? `Today · ${fmt(s.date, { weekday: "long", month: "short", day: "numeric" })}` : `Next · ${fmt(s.date, { weekday: "long", month: "short", day: "numeric" })}`;
    const on = done.has(s.date);
    return `<div class="ln-today check-row${on ? " done" : ""}" style="--pc:${s.phase.color}">
      <p class="eyebrow">${when}</p>
      <div class="ln-today-main">
        ${checkBtn(s.date, s.task)}
        <div>
          <p class="ln-meta"><span class="ln-dot"></span>${esc(s.phase.name)} · Week ${s.week}, ${DAYS[s.day]} · ${esc(s.title)}${s.holiday ? ` · <span class="ln-hol">${esc(s.holiday)} (optional)</span>` : ""}</p>
          <h3><span class="strike">${esc(s.task)}</span></h3>
        </div>
      </div>
      <div class="ln-links"><span class="muted small">Use:</span>${links(s.phase.tools.slice(0, 2))}${s.phase.videos[0] ? links([s.phase.videos[0]]) : ""}</div>
    </div>`;
  }

  function missedHtml() {
    if (today <= LEARN_START) return "";
    const m = missed([...done], today);
    if (!m.length) return "";
    return `<div class="ln-missed"><b>${m.length} to catch up</b>${m.slice(0, 6).map((i) => `<a href="#ln-w${session(i).week}">${fmt(sessionDate(i), { month: "short", day: "numeric" })}</a>`).join("")}${m.length > 6 ? `<span class="muted small">+${m.length - 6} more</span>` : ""}
      <span class="muted small">Weekends are good for catching up.</span></div>`;
  }

  function weeksHtml() {
    const curWeek = session(currentSession(today)).week;
    return PHASES.map((p) => {
      const pr = phaseProgress(p, [...done]);
      const weeks = [];
      for (let w = p.weeks[0]; w <= p.weeks[1]; w++) {
        const [title, tasks] = WEEKS[w - 1];
        const first = sessionDate((w - 1) * 5);
        const doneIn = tasks.filter((_, d) => done.has(sessionDate((w - 1) * 5 + d))).length;
        weeks.push(`<details class="ln-week" id="ln-w${w}"${w === curWeek ? " open" : ""}>
          <summary><span class="ln-wk">Week ${w}</span><b>${esc(title)}</b><span class="muted small">${fmt(first, { month: "short", day: "numeric" })}</span><span class="ln-count${doneIn === 5 ? " full" : ""}">${doneIn}/5</span></summary>
          <ol>${tasks.map((t, d) => {
            const n = (w - 1) * 5 + d, s = session(n), on = done.has(s.date), late = !on && s.date < today;
            return `<li class="check-row${on ? " done" : ""}${late ? " late" : ""}${s.date === today ? " is-today" : ""}">${checkBtn(s.date, t)}
              <span class="ln-day">${DAYS[d]} ${fmt(s.date, { month: "short", day: "numeric" })}${s.holiday ? `<em>${esc(s.holiday)}</em>` : ""}</span><span class="ln-task"><span class="strike">${esc(t)}</span></span></li>`;
          }).join("")}</ol></details>`);
      }
      return `<section class="ln-phase-block" id="ln-${p.key}" style="--pc:${p.color}">
        <header><div><h2><span class="ln-dot"></span>${esc(p.name)}</h2><p class="muted small">Weeks ${p.weeks[0]}–${p.weeks[1]} · ${esc(p.why)}</p></div><span class="ln-count${pr.done === pr.total ? " full" : ""}">${pr.done}/${pr.total}</span></header>
        ${p.note ? `<p class="ln-note">⚠️ ${esc(p.note)}</p>` : ""}
        <div class="ln-res"><div><span class="ln-k">Free tools</span>${links(p.tools)}</div>${p.videos.length ? `<div><span class="ln-k">Videos</span>${links(p.videos)}</div>` : ""}</div>
        ${weeks.join("")}</section>`;
    }).join("");
  }

  function render(t) {
    if (t) today = t;
    root.innerHTML = `
      <div class="panel ln-hero">
        <div class="ln-head"><div><h2>Learn to code in 8 months</h2><p class="muted">1 hour a day, Monday to Friday · HTML & CSS → JavaScript → SQL → Python → Swift · ${fmt(LEARN_START, { month: "short", day: "numeric" })} to ${fmt(sessionDate(TOTAL - 1), { month: "short", day: "numeric", year: "numeric" })}</p></div></div>
        <div class="ln-stats" id="ln-stats">${statsHtml()}</div>
        <nav class="ln-strip" id="ln-strip" aria-label="Phases">${stripHtml()}</nav>
      </div>
      <div id="ln-today">${todayHtml()}</div>
      <div id="ln-missed">${missedHtml()}</div>
      <div class="ln-weeks">${weeksHtml()}</div>`;
  }

  function refreshSummary() {
    root.querySelector("#ln-stats").innerHTML = statsHtml();
    root.querySelector("#ln-strip").innerHTML = stripHtml();
    root.querySelector("#ln-missed").innerHTML = missedHtml();
    root.querySelectorAll(".ln-week").forEach((el, w) => {
      const n = [0, 1, 2, 3, 4].filter((d) => done.has(sessionDate(w * 5 + d))).length;
      const c = el.querySelector("summary .ln-count"); c.textContent = `${n}/5`; c.classList.toggle("full", n === 5);
    });
    root.querySelectorAll(".ln-phase-block").forEach((el, i) => {
      const pr = phaseProgress(PHASES[i], [...done]);
      const c = el.querySelector("header .ln-count"); c.textContent = `${pr.done}/${pr.total}`; c.classList.toggle("full", pr.done === pr.total);
    });
  }

  function paint(date, on) {
    root.querySelectorAll(`[data-learn="${date}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/^Mark (not )?done/, on ? "Mark not done" : "Mark done"));
      const row = b.closest(".check-row"); row.classList.toggle("done", on); row.classList.toggle("late", !on && date < today);
    });
  }

  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-learn]");
    if (!b) return;
    const date = b.dataset.learn, on = !done.has(date);
    if (on) done.add(date); else done.delete(date);
    paint(date, on); refreshSummary();
    try {
      await store.setLearnTick(date, on);
      onChange?.([...done]);
      if (on && done.size % 25 === 0) toast(`🎉 ${done.size} sessions done!`);
    } catch (err) {
      if (on) done.delete(date); else done.add(date);
      paint(date, !on); refreshSummary();
      toast(`Couldn't save: ${err.message}`);
    }
  });

  return {
    async load(t) {
      today = t;
      if (!loaded) { done = new Set(await store.learnTicks()); loaded = true; }
      render(t);
    },
    reset() { loaded = false; },
    doneDates: () => [...done],
  };
}
