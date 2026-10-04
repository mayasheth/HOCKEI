// HTML for the feed: game summaries, live goal cards and scoreboard rows.
import { teamName, chip } from "../teams.js";
import { nth } from "../facts.js";
import { esc, hash, rng, penSVG, circled, dashed } from "./pen.js";
import { GoalDrawing, loadTrack, frameBox, onceVisible, reduceMotion } from "./draw.js";

export const ORD = (per) => (per <= 3 ? ["1st", "2nd", "3rd"][per - 1] : per === 4 ? "OT" : `${per - 3}OT`);
const STR = { PP: "PPG", SH: "SHG", EN: "ENG" };
const mmss = (m) => { const s = Math.round(m * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export const lost = (g) => g.os > g.rs;

// Running score after each goal against; shown only while the rival trails.
export function scoringRows(g) {
  const evs = [...g.goals.map((x) => ({ t: x.t, x })), ...g.ours.map((t) => ({ t, us: true }))].sort((a, b) => a.t - b.t || (a.us ? -1 : 1));
  let rs = 0, os = 0;
  const rows = [];
  evs.forEach((e) => { if (e.us) { rs++; return; } os++; rows.push({ x: e.x, sc: os > rs ? `${g.opp} ${os}–${rs}` : "" }); });
  return rows;
}

// One line of context for a goal, from this game's own scoring sheet.
export function goalContext(g, x) {
  const i = g.goals.indexOf(x), before = g.goals.slice(0, i), out = [];
  const own = before.filter((y) => y.name === x.name).length;
  if (own) out.push(`${x.name}’s ${nth(own + 1)} of the night.`);
  const inPer = g.goals.slice(0, i + 1).filter((y) => y.per === x.per).length;
  if (inPer >= 2) out.push(`${nth(inPer)} goal against in the ${x.per <= 3 ? ["first", "second", "third"][x.per - 1] + " period" : "overtime"}.`);
  const prev = before[before.length - 1];
  if (prev && x.t - prev.t < 3) out.push(`${mmss(x.t - prev.t)} after the last one.`);
  if (!out.length) out.push(i === 0 ? "Opening goal." : `${nth(i + 1)} goal against.`);
  return out.slice(0, 2).join(" ");
}

function scoreline(g, r) {
  if (!lost(g)) return `<div class="sl won" aria-hidden="true"><span class="nm">${teamName(g.rival)}</span><span class="vs">vs</span><span class="nm">${teamName(g.opp)}</span></div>`;
  return `<div class="sl" aria-hidden="true"><span class="nm">${teamName(g.opp)}</span><span class="v">${g.os}</span><span class="nm loser">${teamName(g.rival)}</span><span class="v">${circled(g.rs, r, 0.9)}</span></div>`;
}
const srScore = (g) => (lost(g) ? `${teamName(g.opp)} ${g.os}, ${teamName(g.rival)} ${g.rs}` : `${teamName(g.rival)} vs ${teamName(g.opp)}`);
const tagOf = (x) => STR[x.tag] || "";

export function summaryEl(g) {
  const r = rng(hash(g.key + "|sum"));
  const d = new Date(`${g.date}T12:00:00Z`);
  const [dow, mon, day] = [d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), d.getUTCDate()];
  const lead = lost(g) && g.stats.length === 3;
  const el = document.createElement("article");
  el.className = "game" + (lost(g) ? "" : " won");
  el.dataset.key = g.key;
  el.dataset.date = g.date;
  const rows = scoringRows(g);
  el.innerHTML = `<div class="dl"><span class="mono">${dow}</span><span class="day">${day}</span><span class="mono">${mon}</span><span class="tm"><i style="background:${chip(g.rival)}"></i>${g.rival}</span></div>
    <div class="gbody"><div class="kick">${esc(g.kicker)}</div>
    <h3 class="sr">${esc(srScore(g))}</h3>${scoreline(g, r)}
    ${g.deck ? `<p class="deck">${esc(g.deck)}</p>` : ""}
    ${g.stats.length ? `<div class="stats">${g.stats.map((it, k) => `<div class="st${lead && k === 0 ? " lead" : ""}"><span class="n">${dashed(it.big)}</span><span class="l">${esc(it.l)}</span>${it.s ? `<span class="s">${esc(it.s)}</span>` : ""}</div>`).join("")}</div>` : ""}
    ${rows.length ? `<div><div class="mono" style="margin-bottom:10px">${rows.length === 1 ? "The goal against" : `All ${rows.length} goals against`}</div><div class="multi"></div></div>` : ""}</div>`;
  const multi = el.querySelector(".multi"), ds = [];
  rows.forEach((z, k) => {
    const x = z.x, worst = x.sev >= 60, fig = document.createElement("figure");
    fig.className = "draw";
    fig.style.setProperty("--k", k);
    const dr = new GoalDrawing(g.rival, `Puck and skater paths before ${x.name}’s goal`);
    ds.push([dr, x]);
    fig.appendChild(dr.el);
    fig.insertAdjacentHTML("beforeend", `<figcaption><span class="mono" style="font-size:11px">${ORD(x.per)} ${x.clock}${tagOf(x) ? ` · ${tagOf(x)}` : ""}</span><span class="nm"><span class="pw">${esc(x.name)}${worst ? penSVG("under2", r, "left:-2px;bottom:-7px;width:calc(100% + 4px);height:8px", 1.8, 1.2 + k * 0.12) : ""}</span></span>${z.sc ? `<span class="ag" style="font-size:13px;color:var(--mu)">${dashed(z.sc)}</span>` : ""}</figcaption>`);
    multi.appendChild(fig);
  });
  // Load tracking once the summary is near the screen, then draw every goal in one shared crop.
  onceVisible(el, async () => {
    el.classList.add("print");
    const tracks = await Promise.all(ds.map(([, x]) => loadTrack(x.ppt, g.rival)));
    const box = frameBox(tracks);
    ds.forEach(([dr], k) => { dr.setTrack(tracks[k], box); dr.play(1600, 300 + k * 200); });
  });
  return el;
}

// "12 min ago". Estimated times (goals scored before the page first saw them) get a "~".
export function ago(at, approx) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  const txt = m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} hr ${m % 60 ? `${m % 60} min ` : ""}ago`;
  return approx && m >= 1 ? `~${txt}` : txt;
}
export function refreshAgo(root = document) {
  root.querySelectorAll(".ago").forEach((n) => (n.textContent = ago(+n.dataset.at, n.dataset.approx === "1")));
}

// Live goal card: text first; the drawing rolls in once NHL tracking is published
// (usually several minutes after the goal). Retries every minute for 20 minutes.
export function feedCard(g, x, isNew, at, approx) {
  const r = rng(hash(`${g.key}|${x.id}|feed`)), worst = x.sev >= 60;
  const z = scoringRows(g).find((q) => q.x === x);
  const el = document.createElement("article");
  el.className = "goal notrack" + (isNew ? " new" : "");
  el.dataset.game = g.key;
  el.dataset.goal = x.id;
  el.innerHTML = `<figure class="draw"></figure><div>
    <div class="kick" style="display:flex;align-items:center;gap:8px;color:var(--ink2)"><i style="width:9px;height:9px;display:block;background:${chip(g.rival)}"></i>${g.rival} vs ${g.opp}<span class="mono ago" data-at="${at}" data-approx="${approx ? 1 : 0}">${ago(at, approx)}</span></div>
    <div class="mono" style="margin-top:8px">${ORD(x.per)} · ${x.clock}${tagOf(x) ? ` · ${tagOf(x)}` : ""}</div>
    <div class="who"><span class="pw">${esc(x.name)}${worst ? penSVG("under2", r, "left:-2px;bottom:-10px;width:calc(100% + 4px);height:10px", 2.2, isNew ? 0.9 : 0) : ""}</span></div>
    <p class="ctx">${esc(goalContext(g, x))}</p>
    ${z && z.sc ? `<div class="ag" style="margin-top:10px;font-weight:700">${dashed(z.sc)}</div>` : ""}</div>`;
  const dr = new GoalDrawing(g.rival, `Puck and skater paths before ${x.name}’s goal`);
  el.querySelector("figure").appendChild(dr.el);
  let tries = 0;
  const attempt = async () => {
    const t = await loadTrack(x.ppt, g.rival);
    if (t) {
      const arriving = el.isConnected;
      el.classList.remove("notrack");
      if (arriving) el.classList.add("trackin");
      dr.setTrack(t);
      (isNew || arriving) && !reduceMotion() ? dr.play(2400, 200) : dr.draw(1);
      return;
    }
    if (x.ppt && ++tries < 20) setTimeout(() => { if (!el.dataset.gone) attempt(); }, 60000);
  };
  attempt();
  return el;
}

const flapHTML = (str) => `<span class="flap" aria-hidden="true">${[...String(str)].map((c) => `<b>${c}</b>`).join("")}</span>`;

// Scoreboard row: score only while the rival trails (or lost); clock or status on the right.
export function sbRow(g, status) {
  const r = rng(hash(g.key + "|live"));
  const fin = status === "Final";
  const score = g.os > g.rs
    ? `<i>${teamName(g.opp)}</i> ${flapHTML(g.os)} <i>${teamName(g.rival)}</i> ${fin ? circled(g.rs, r, 0.1) : flapHTML(g.rs)}<span class="sr">${teamName(g.opp)} ${g.os}, ${teamName(g.rival)} ${g.rs}</span>`
    : `<i>${teamName(g.rival)}</i> <span class="vs">vs</span> <i>${teamName(g.opp)}</i>`;
  return `<span class="sq" style="background:${chip(g.rival)}"></span><span class="sc">${score}</span><span class="mono">${esc(status)}</span>`;
}
