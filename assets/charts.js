// Hand-built SVG charts: one series each, thin 2px lines, recessive grid,
// crosshair + tooltip on hover (and arrow keys), table view for accessibility.

const NS = "http://www.w3.org/2000/svg";
const fmtDay = (s, opts) => new Date(s + "T00:00:00Z").toLocaleDateString("en-CA", { timeZone: "UTC", ...opts });

function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}
const fmtNum = (n) => (n >= 10000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(Math.round(n)));

export function areaChart(host, data, { label = "Value", unit = "" } = {}) {
  host.innerHTML = "";
  host.classList.add("chart");
  const W = Math.max(280, host.clientWidth || 600), H = host.clientHeight || 260;
  const pad = { l: 44, r: 14, t: 14, b: 30 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / top) * ih;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W); svg.setAttribute("height", H);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${label}, ${data.length} days. Use the table view for exact numbers.`);
  const gid = "g" + Math.random().toString(36).slice(2, 8);
  let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="var(--series-1)" stop-opacity=".22"/><stop offset="1" stop-color="var(--series-1)" stop-opacity="0"/></linearGradient></defs>`;
  for (const t of ticks) {
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="grid${t === 0 ? " base" : ""}"/>`;
    s += `<text x="${pad.l - 8}" y="${y(t)}" class="ylab" text-anchor="end" dominant-baseline="middle">${fmtNum(t)}</text>`;
  }
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 90))));
  data.forEach((d, i) => {
    if (i % every === 0 || i === data.length - 1) {
      if (i !== data.length - 1 && data.length - 1 - i < every * 0.6) return; // keep the last label clear
      s += `<text x="${x(i)}" y="${H - 8}" class="xlab" text-anchor="${i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}">${fmtDay(d.day, { month: "short", day: "numeric" })}</text>`;
    }
  });
  if (data.length) {
    const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
    s += `<path d="${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#${gid})"/>`;
    s += `<path d="${line}" class="line"/>`;
    const li = data.length - 1;
    s += `<circle cx="${x(li)}" cy="${y(data[li].value)}" r="4" class="end"/>`;
  }
  s += `<g class="hover" visibility="hidden"><line class="cross" y1="${pad.t}" y2="${pad.t + ih}"/><circle r="5" class="dot"/></g>`;
  svg.innerHTML = s;
  host.append(svg);

  const tip = document.createElement("div");
  tip.className = "tip"; tip.hidden = true;
  host.append(tip);
  const hover = svg.querySelector(".hover");
  let idx = data.length - 1;
  function show(i) {
    if (!data.length) return;
    idx = Math.max(0, Math.min(data.length - 1, i));
    const d = data[idx];
    hover.setAttribute("visibility", "visible");
    hover.querySelector(".cross").setAttribute("x1", x(idx)); hover.querySelector(".cross").setAttribute("x2", x(idx));
    const dot = hover.querySelector(".dot"); dot.setAttribute("cx", x(idx)); dot.setAttribute("cy", y(d.value));
    tip.innerHTML = `<span>${fmtDay(d.day, { weekday: "short", month: "short", day: "numeric" })}</span><b>${Math.round(d.value).toLocaleString("en-CA")}${unit}</b>`;
    tip.hidden = false;
    const left = x(idx) / W * host.clientWidth;
    tip.style.left = `${Math.min(host.clientWidth - 8, Math.max(8, left))}px`;
    tip.style.transform = `translate(${left > host.clientWidth * 0.7 ? "-100%" : left < host.clientWidth * 0.3 ? "0" : "-50%"}, 0)`;
  }
  function hide() { hover.setAttribute("visibility", "hidden"); tip.hidden = true; }
  host.onpointermove = (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    show(Math.round(((px - pad.l) / iw) * (data.length - 1)));
  };
  host.onpointerleave = hide;
  host.tabIndex = 0;
  host.onkeydown = (e) => {
    if (e.key === "ArrowLeft") { show(idx - 1); e.preventDefault(); }
    if (e.key === "ArrowRight") { show(idx + 1); e.preventDefault(); }
    if (e.key === "Escape") hide();
  };
  host.onblur = hide;
}

export function sparkline(data, { w = 120, h = 36 } = {}) {
  if (data.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><line x1="2" x2="${w - 2}" y1="${h / 2}" y2="${h / 2}" class="spark-empty"/></svg>`;
  const vals = data.map((d) => d.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i) => 2 + (i / (data.length - 1)) * (w - 8);
  const y = (v) => h - 4 - ((v - lo) / span) * (h - 8);
  const d = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const li = data.length - 1;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}"/><circle cx="${x(li)}" cy="${y(data[li].value)}" r="3"/></svg>`;
}

export function tableHTML(data, label) {
  return `<table class="data-table"><thead><tr><th>Day</th><th>${label}</th></tr></thead><tbody>${data.slice().reverse().map((d) =>
    `<tr><td>${fmtDay(d.day, { weekday: "short", month: "short", day: "numeric" })}</td><td>${Math.round(d.value).toLocaleString("en-CA")}</td></tr>`).join("")}</tbody></table>`;
}
