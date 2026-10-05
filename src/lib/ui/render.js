// HTML for the feed: game summaries, live goal cards and scoreboard rows.
// Each game entry has a role: "rival" (goals against, red pen) or "fav" (goals for, blue pen).
// A favorite scoring on a rival is one "both" item carrying both entries.
import { teamName, chip, inks } from "../teams.js";
import { nth, failWord } from "../facts.js";
import { esc, hash, rng, penSVG, circled, dashed, newsMark } from "./pen.js";
import { GoalDrawing, loadTrack, frameBox, onceVisible, reduceMotion } from "./draw.js";

export const ORD = (per) => (per <= 3 ? ["1st", "2nd", "3rd"][per - 1] : per === 4 ? "OT" : `${per - 3}OT`);
const STR = { PP: "PPG", SH: "SHG", EN: "ENG" };
const mmss = (m) => { const s = Math.round(m * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const isFav = (g) => g.role === "fav";
// The news is good: a rival lost, or a favorite won.
export const lost = (g) => g.os > g.rs;
const goodNews = (g) => (isFav(g) ? g.rs > g.os : g.os > g.rs);

// Running score after each listed goal; shown only while the news is good (rival trails, favorite leads).
export function scoringRows(g) {
  const evs = [...g.goals.map((x) => ({ t: x.t, x })), ...g.ours.map((t) => ({ t, us: true }))].sort((a, b) => a.t - b.t || (a.us ? -1 : 1));
  let other = 0, scorer = 0;
  const rows = [], leader = isFav(g) ? g.rival : g.opp;
  evs.forEach((e) => { if (e.us) { other++; return; } scorer++; rows.push({ x: e.x, sc: scorer > other ? `${leader} ${scorer}–${other}` : "" }); });
  return rows;
}

// Overtime is sudden death, so any overtime goal is the winner.
export const otWinner = (x) => x.per >= 4;
const otTag = (r, delay, good) => `<span class="pw otmark">OT${penSVG("circle", r, "left:-.45em;top:-.3em;width:calc(100% + .9em);height:calc(100% + .6em)", 2, delay, good)}</span>`;

// One line of context for a goal, from this game's own scoring sheet.
export function goalContext(g, x) {
  const i = g.goals.indexOf(x), before = g.goals.slice(0, i), out = [];
  if (otWinner(x)) out.push(`Overtime winner, ${x.clock} in.`);
  const own = before.filter((y) => y.name === x.name).length;
  if (own) out.push(`${x.name}’s ${nth(own + 1)} of the night.`);
  const inPer = g.goals.slice(0, i + 1).filter((y) => y.per === x.per).length;
  if (inPer >= 2 && !otWinner(x)) out.push(`${nth(inPer)} ${isFav(g) ? "goal" : "goal against"} in the ${["first", "second", "third"][x.per - 1]} period.`);
  const prev = before[before.length - 1];
  if (prev && x.t - prev.t < 3) out.push(`${mmss(x.t - prev.t)} after the last one.`);
  if (!out.length) out.push(i === 0 ? "Opening goal." : `${nth(i + 1)} of the night.`);
  return out.slice(0, 2).join(" ");
}
const tagOf = (x) => STR[x.tag] || "";

// Shootout attempts that are good news: a rival's shooter failing or its goalie beaten,
// a favorite's shooter scoring or its goalie making the stop.
export const soGood = (g, x) => (isFav(g) ? x.byTeam === (x.res === "goal") : x.byTeam !== (x.res === "goal"));
const soResult = (x) => (x.res === "goal" ? "Goal" : x.res === "fail" ? "No shot" : failWord(x)[0].toUpperCase() + failWord(x).slice(1));
// The last attempt of a finished shootout decided it.
const soDecider = (g, x) => g.so[g.so.length - 1] === x && g.os !== g.rs;
const timeLine = (x, r, delay, good) => `${otWinner(x) ? `${otTag(r, delay, good)} · ${x.clock} · Winner` : `${ORD(x.per)} · ${x.clock}`}${tagOf(x) ? ` · ${tagOf(x)}` : ""}`;

/* ---------- Recent: game summaries ---------- */

// Box-score scoreline, winner on top. Rival lost: red circle on its score. Favorite won: blue circle.
// For "both", the favorite's score is circled blue and the rival's red.
function scoreline(rivalG, favG, r) {
  const g = rivalG || favG;
  if (!goodNews(g)) return `<div class="sl won" aria-hidden="true"><span class="nm">${teamName(g.rival)}</span><span class="vs">vs</span><span class="nm">${teamName(g.opp)}</span></div>`;
  const winner = favG ? favG.rival : g.opp, loser = rivalG ? rivalG.rival : g.opp;
  const ws = favG ? favG.rs : g.os, ls = rivalG ? rivalG.rs : favG.os;
  const wv = favG ? circled(ws, r, 0.9, true) : ws, lv = rivalG ? circled(ls, r, 1.1) : ls;
  return `<div class="sl" aria-hidden="true"><span class="nm">${teamName(winner)}</span><span class="v">${wv}</span><span class="nm loser">${teamName(loser)}</span><span class="v">${lv}</span></div>`;
}
const statsHTML = (stats, lead) => stats.length
  ? `<div class="stats">${stats.map((it, k) => `<div class="st${lead && k === 0 ? " lead" : ""}"><span class="n">${dashed(it.big)}</span><span class="l">${it.mark || ""}${esc(it.l)}</span>${it.s ? `<span class="s">${esc(it.s)}</span>` : ""}</div>`).join("")}</div>`
  : "";
// "Both": one row of up to four stats, two from each side first, each marked bad (rival) or good (favorite).
function bothStats(rivalStats, favStats, r) {
  const bad = rivalStats.map((s) => ({ ...s, mark: newsMark("rival", r) + " " })), good = favStats.map((s) => ({ ...s, mark: newsMark("fav", r) + " " }));
  const pick = [...bad.slice(0, 2), ...good.slice(0, 2)];
  return [...pick, ...bad.slice(2), ...good.slice(2)].slice(0, 4);
}

// Every shootout attempt in order; the good-news ones in full ink, the decider underlined.
// Past three rounds, only the good-news attempts are listed.
function soList(g, r) {
  const good = isFav(g), rounds = Math.max(...g.so.map((x) => x.rd));
  const shown = rounds > 3 ? g.so.filter((x) => soGood(g, x)) : g.so;
  const li = shown.map((x) => `<li class="${soGood(g, x) ? "" : "dim"}"><span class="t mono">Rd ${x.rd}</span><span class="nm">${soDecider(g, x) && soGood(g, x) ? `<span class="pw">${esc(x.name)}${penSVG("under2", r, "left:-2px;bottom:-6px;width:calc(100% + 4px);height:7px", 1.6, 1.4, good)}</span>` : esc(x.name)} <span class="mono tag">${x.team}</span></span><span class="sc">${soResult(x)}</span></li>`).join("");
  return `<div class="solist"><div class="mono" style="margin-bottom:6px">Shootout${rounds > 3 ? ` · ${rounds} rounds` : ""}</div><ol class="glist ag">${li}</ol></div>`;
}

export function summaryEl(item) {
  const both = item.role === "both";
  const rivalG = both ? item.rival : item.role === "rival" ? item : null;
  const favG = both ? item.fav : item.role === "fav" ? item : null;
  const g = rivalG || favG, good = !rivalG;
  const r = rng(hash(item.key + "|sum"));
  const d = new Date(`${item.date}T12:00:00Z`);
  const [dow, mon, day] = [d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), d.getUTCDate()];
  const el = document.createElement("article");
  el.className = "game" + (goodNews(g) ? "" : " won");
  el.dataset.key = item.key;
  el.dataset.date = item.date;
  // Goals drawn: goals against the rival (the favorite's goals, when it's both), else the favorite's goals.
  const rows = scoringRows(g);
  const kind = both ? "both" : good ? "fav" : "rival";
  const chips = [favG, rivalG].filter(Boolean).map((x) => `<span class="tm"><i style="background:${chip(x.rival)}"></i>${x.rival}</span>`).join("");
  const srText = goodNews(g) ? `${teamName(favG ? favG.rival : g.opp)} ${favG ? favG.rs : g.os}, ${teamName(rivalG ? rivalG.rival : g.opp)} ${rivalG ? rivalG.rs : favG.os}` : `${teamName(g.rival)} vs ${teamName(g.opp)}`;
  const deck = [rivalG?.deck, favG?.deck].filter(Boolean).join(" ");
  const statList = both ? bothStats(rivalG.stats, favG.stats, r) : g.stats;
  // A single stat sits beside the scoreline instead of taking a row of its own.
  const lone = statList.length === 1 ? statList[0] : null;
  const statBlocks = lone ? "" : statsHTML(statList, !both && goodNews(g) && statList.length === 3);
  const top = lone
    ? `<div class="slrow">${scoreline(rivalG, favG, r)}<div class="st side"><span class="n">${dashed(lone.big)}</span><span class="l">${lone.mark || ""}${esc(lone.l)}</span>${lone.s ? `<span class="s">${esc(lone.s)}</span>` : ""}</div></div>`
    : scoreline(rivalG, favG, r);
  // Every goal goes in a compact scoring list; only the ones that matter get a drawing:
  // the winner, overtime, shorthanded, and each goal of a hat trick.
  const tally = new Map();
  rows.forEach((z) => tally.set(z.x.name, (tally.get(z.x.name) || 0) + 1));
  const featured = (x) => x.gwg || x.sev >= 60 || tally.get(x.name) >= 3;
  const why = (x) => (otWinner(x) ? "" : x.gwg ? "Winner" : x.tag === "SH" ? "" : tally.get(x.name) >= 3 ? "Hat trick" : "");
  const label = good ? (rows.length === 1 ? "The goal" : `${rows.length} goals`) : rows.length === 1 ? "The goal against" : `${rows.length} goals against`;
  el.innerHTML = `<div class="dl"><span class="mono">${dow}</span><span class="day">${day}</span><span class="mono">${mon}</span>${chips}</div>
    <div class="gbody"><div class="kick" style="display:flex;align-items:center;gap:8px">${newsMark(kind, r, 0.4)}${esc(g.kicker)}</div>
    <h3 class="sr">${esc(srText)}</h3>${top}
    ${deck ? `<p class="deck">${esc(deck)}</p>` : ""}
    ${statBlocks}
    ${rows.length ? `<div class="goals"><div class="multi"></div><div><div class="mono" style="margin-bottom:6px">${label}</div><ol class="glist ag"></ol></div></div>` : ""}
    ${g.so?.length ? soList(g, r) : ""}</div>`;
  const multi = el.querySelector(".multi"), list = el.querySelector(".glist"), ds = [];
  const pair = both ? [inks(favG.rival)[0], inks(rivalG.rival)[0]] : undefined;
  rows.forEach((z, k) => {
    const x = z.x, big = x.sev >= 60;
    list.insertAdjacentHTML("beforeend", `<li><span class="t mono">${ORD(x.per)} ${x.clock}</span><span class="nm"><span class="pw">${esc(x.name)}${big ? penSVG("under2", r, "left:-2px;bottom:-6px;width:calc(100% + 4px);height:7px", 1.6, 1.2 + k * 0.1, good) : ""}</span>${tagOf(x) ? ` <span class="mono tag">${tagOf(x)}</span>` : ""}</span><span class="sc">${z.sc ? dashed(z.sc) : ""}</span></li>`);
    if (!featured(x)) return;
    const fig = document.createElement("figure");
    fig.className = "draw";
    fig.style.setProperty("--k", ds.length);
    const dr = new GoalDrawing(g.rival, `Puck and skater paths before ${x.name}’s goal`, pair);
    ds.push([dr, x]);
    fig.appendChild(dr.el);
    const w = why(x);
    fig.insertAdjacentHTML("beforeend", `<figcaption><span class="mono" style="font-size:11px">${timeLine(x, r, 1.2, good).replace(/ · /, " ")}${w ? ` · ${w}` : ""}</span><span class="nm">${esc(x.name)}</span></figcaption>`);
    multi.appendChild(fig);
  });
  if (!ds.length) multi.remove();
  // Load tracking once the summary is near the screen, then draw every goal in one shared crop.
  // The defending team's skaters are drawn faintest.
  const defender = good ? g.opp : g.rival;
  onceVisible(el, async () => {
    el.classList.add("print");
    const tracks = await Promise.all(ds.map(([, x]) => loadTrack(x.ppt, defender)));
    const box = frameBox(tracks);
    ds.forEach(([dr], k) => { dr.setTrack(tracks[k], box); dr.play(1600, 300 + k * 200); });
  });
  return el;
}

/* ---------- Live: goal cards ---------- */

// "12 min ago". Estimated times (goals scored before the page first saw them) get a "~".
export function ago(at, approx) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  const txt = m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} hr ${m % 60 ? `${m % 60} min ` : ""}ago`;
  return approx && m >= 1 ? `~${txt}` : txt;
}
export function refreshAgo(root = document) {
  root.querySelectorAll(".ago").forEach((n) => (n.textContent = ago(+n.dataset.at, n.dataset.approx === "1")));
}

// Live goal card: text first; the drawing rolls in once NHL tracking is published (usually several
// minutes after the goal). Retries every minute for 20 minutes. `favG` is set when the goal is also
// a favorite's goal against a rival ("both").
export function feedCard(g, x, isNew, at, approx, favG) {
  const both = !!favG && !isFav(g), good = isFav(g);
  const r = rng(hash(`${g.key}|${x.id}|feed`)), big = x.sev >= 60;
  const z = scoringRows(g).find((q) => q.x === x);
  const el = document.createElement("article");
  el.className = "goal notrack" + (isNew ? " new" : "") + (otWinner(x) ? " otw" : "");
  el.dataset.game = String(g.id);
  el.dataset.goal = x.id;
  const kind = both ? "both" : good ? "fav" : "rival";
  const scorerTeam = good ? g.rival : g.opp;
  const delay = isNew ? 0.9 : 0;
  const head = good
    ? `<div class="who"><span class="pw">Goal for${big ? penSVG("under2", r, "left:-2px;bottom:-10px;width:calc(100% + 4px);height:10px", 2.2, delay, true) : ""}</span> <span class="whoteam">${teamName(g.rival)}</span></div>`
    : `<div class="who"><span class="pw">Goal against${big ? penSVG("under2", r, "left:-2px;bottom:-10px;width:calc(100% + 4px);height:10px", 2.2, delay) : ""}</span> <span class="whoteam">${teamName(g.rival)}</span></div>`
      + (both ? `<div class="who2"><span class="pw">Goal for${penSVG("under2", r, "left:-2px;bottom:-6px;width:calc(100% + 4px);height:7px", 1.8, delay + 0.3, true)}</span> <span class="whoteam">${teamName(favG.rival)}</span></div>` : "");
  el.innerHTML = `<figure class="draw"></figure><div>
    <div class="kick" style="display:flex;align-items:center;gap:8px;color:var(--ink2)">${newsMark(kind, r, isNew ? 0.3 : 0)}<i style="width:9px;height:9px;display:block;background:${chip(g.rival)}"></i>${g.rival} vs ${g.opp}<span class="mono ago" data-at="${at}" data-approx="${approx ? 1 : 0}">${ago(at, approx)}</span></div>
    <div class="mono" style="margin-top:8px">${timeLine(x, r, isNew ? 0.6 : 0, good)}</div>
    ${head}
    <div class="by">${esc(x.name)} <span>${scorerTeam}</span></div>
    <p class="ctx">${esc(goalContext(g, x))}</p>
    ${z && z.sc ? `<div class="ag" style="margin-top:10px;font-weight:700">${dashed(z.sc)}</div>` : ""}</div>`;
  const pair = both ? [inks(favG.rival)[0], inks(g.rival)[0]] : undefined;
  const dr = new GoalDrawing(g.rival, `Puck and skater paths before ${x.name}’s goal`, pair);
  el.querySelector("figure").appendChild(dr.el);
  const defender = good ? g.opp : g.rival;
  let tries = 0;
  const attempt = async () => {
    const t = await loadTrack(x.ppt, defender);
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

// Live shootout item: a smaller, text-only card for each good-news attempt.
export function soCard(g, x, isNew, at, approx, favG) {
  const both = !!favG && !isFav(g), good = isFav(g);
  const r = rng(hash(`${g.key}|${x.id}|feed`)), last = soDecider(g, x);
  const el = document.createElement("article");
  el.className = "goal so notrack" + (isNew ? " new" : "");
  el.dataset.game = String(g.id);
  el.dataset.goal = x.id;
  const kind = both ? "both" : good ? "fav" : "rival";
  const delay = isNew ? 0.9 : 0;
  const pen = (on, fav) => (on ? penSVG("under2", r, "left:-2px;bottom:-8px;width:calc(100% + 4px);height:8px", 2, delay, fav) : "");
  const miss = x.res !== "goal" && x.res !== "save";
  // Heading from the followed team's side; for "both", the favorite's side follows.
  const heads = [];
  if (good) heads.push(x.byTeam ? ["Shootout goal for", g.rival] : miss ? ["Shootout miss", g.opp] : ["Shootout save for", g.rival]);
  else heads.push(x.byTeam ? [miss ? "Shootout miss" : "Shootout save against", g.rival] : ["Shootout goal against", g.rival]);
  if (both && (!x.byTeam || x.res === "save")) heads.push([x.byTeam ? "Shootout save for" : "Shootout goal for", favG.rival]);
  const head = heads.map(([w, t], k) => `<div class="${k ? "who2" : "who"}"><span class="pw">${w}${pen(last && k === 0, good)}</span> <span class="whoteam">${teamName(t)}</span></div>`).join("");
  const ctx = x.res === "goal" ? `Beat ${x.goalie || "the goalie"}.` : x.res === "save" ? `Stopped by ${x.goalie || "the goalie"}.` : x.res === "fail" ? "Lost the puck without a shot." : `${failWord(x)[0].toUpperCase()}${failWord(x).slice(1)}.`;
  el.innerHTML = `<div>
    <div class="kick" style="display:flex;align-items:center;gap:8px;color:var(--ink2)">${newsMark(kind, r, isNew ? 0.3 : 0)}<i style="width:9px;height:9px;display:block;background:${chip(g.rival)}"></i>${g.rival} vs ${g.opp}<span class="mono ago" data-at="${at}" data-approx="${approx ? 1 : 0}">${ago(at, approx)}</span></div>
    <div class="mono" style="margin-top:8px">Shootout · Round ${x.rd}</div>
    ${head}
    <div class="by">${esc(x.name)} <span>${x.team}</span></div>
    <p class="ctx">${esc(ctx)}${last ? " Ends the shootout." : ""}</p></div>`;
  return el;
}

/* ---------- Live: scoreboard rows ---------- */

const flapHTML = (str) => `<span class="flap" aria-hidden="true">${[...String(str)].map((c) => `<b>${c}</b>`).join("")}</span>`;

// One row per game. The score shows only while the news is good (rival trails, favorite leads),
// leader first. A final gets the pen: red circle on a beaten rival's score, blue circle on a winning
// favorite's, and an arrow pointing at the game (red if a rival lost, else blue).
export function sbRow(entries, status, animate = true) {
  const rivalG = entries.filter((e) => !isFav(e)).sort((x, y) => (y.os - y.rs) - (x.os - x.rs))[0], favG = entries.find(isFav);
  const g = rivalG || favG, r = rng(hash(g.id + "|live"));
  const fin = status.startsWith("Final"), delay = animate ? 0.1 : 0;
  let score;
  if (goodNews(g)) {
    const leader = favG ? favG.rival : g.opp, trailer = rivalG ? rivalG.rival : g.opp;
    const ls = favG ? favG.rs : g.os, ts = rivalG ? rivalG.rs : favG.os;
    const lv = fin && favG ? circled(ls, r, delay, true) : flapHTML(ls), tv = fin && rivalG ? circled(ts, r, delay + 0.2) : flapHTML(ts);
    score = `<i>${teamName(leader)}</i> ${lv} <i>${teamName(trailer)}</i> ${tv}<span class="sr">${teamName(leader)} ${ls}, ${teamName(trailer)} ${ts}</span>`;
  } else score = `<i>${teamName(g.rival)}</i> <span class="vs">${g.home === false ? "at" : "vs"}</span> <i>${teamName(g.opp)}</i>`;
  const arrow = fin && goodNews(g) ? `<span class="pw sbarrow">${penSVG("arrow", r, "left:0;top:0;width:100%;height:100%", 2.4, delay + 0.6, !rivalG)}</span>` : "";
  const sq = entries.map((e) => `<span class="sq" style="background:${chip(e.rival)}"></span>`).join("");
  return `<span class="sqs">${sq}</span><span class="sc">${score}${arrow}</span><span class="mono">${esc(status)}</span>`;
}
