// Live section ("Tonight"): a scoreboard row for every rival game today and one feed of goals
// against across all of them, newest first. Finished games stay (marked Final) and their goals
// keep sliding down as new ones arrive; they also join Recent. Polls every 20 s while games are
// live or about to start, 5 min otherwise, and pauses while the tab is hidden.
// `?replay=YYYY-MM-DD` replays a past night instead.
import { esc } from "./pen.js";
import { ORD, feedCard, sbRow, refreshAgo } from "./render.js";

const LIVE = new Set(["LIVE", "CRIT"]);
const FINAL = new Set(["OFF", "FINAL"]);
const localTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const status = (g) => {
  if (g.status) return g.status;
  if (FINAL.has(g.state)) return g.lp === "OT" ? "Final · OT" : g.lp === "SO" ? "Final · SO" : "Final";
  if (g.state === "FUT") return localTime(g.startUTC);
  if (g.state === "PRE") return "Pre-game";
  if (g.clock?.inIntermission) return `${ORD(g.period)} INT`;
  return `${ORD(g.period)} · ${g.clock?.timeRemaining?.replace(/^0(\d)/, "$1") || ""}`;
};
// Rough wall-clock time of a goal scored before the page first saw it: puck drop ~8 min after
// the listed start, ~1.6 real minutes per game minute, two 18-minute intermissions.
const estWall = (g, x) => Date.parse(g.startUTC) + (8 + x.t * 1.6 + 18 * (Math.min(x.per, 3) - 1)) * 60000;
// When this browser first saw each goal, so "min ago" stays exact across reloads.
const SEEN_KEY = "hockei-goal-seen";
function seenTimes() {
  try {
    const m = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"), cut = Date.now() - 2 * 864e5;
    Object.keys(m).forEach((k) => m[k] < cut && delete m[k]);
    return m;
  } catch { return {}; }
}
function saveSeen(m) { try { localStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch { /* private mode */ } }

export function startLive(root, rivals, { replayDate, at = 0, onFinals, next = () => [] }) {
  const shown = new Map(); // key -> { g, row }
  const seen = new Map(); // `${key}|${goalId}` -> card
  let first = true, timer = null;

  root.innerHTML = `<div class="kick" id="liveKick">Live</div><div class="board" id="sb"></div><p class="sr" id="lvSr" aria-live="polite"></p><div class="feed" id="lvFeed"></div><div class="idle" id="lvIdle"></div>`;
  const sb = root.querySelector("#sb"), feed = root.querySelector("#lvFeed"), idle = root.querySelector("#lvIdle"), kick = root.querySelector("#liveKick"), sr = root.querySelector("#lvSr");

  function renderFrame() {
    const any = shown.size > 0, live = [...shown.values()].some((s) => LIVE.has(s.g.state));
    kick.innerHTML = live ? '<span class="livedot"></span>Live' : any ? "Tonight" : "Live";
    sb.hidden = !any;
    feed.hidden = !feed.children.length;
    idle.hidden = any;
    if (any) return;
    const nx = next();
    idle.innerHTML = `<p class="deck" style="margin:0">No rivals playing today.</p>${nx[0] ? `<p class="ag" style="margin:0;color:var(--mu)">Next: ${esc(new Date(nx[0].startUTC).toLocaleDateString("en-US", { weekday: "long" }))}, ${nx[0].rival} ${nx[0].home ? "vs" : "at"} ${nx[0].opp}</p>` : ""}`;
  }

  const firstSeen = replayDate ? {} : seenTimes();
  setInterval(() => refreshAgo(root), 30000);

  function addCard(g, x, isNew, key) {
    const id = `${g.id}-${x.id}`;
    let at = firstSeen[id], approx = false;
    if (!at && isNew) at = firstSeen[id] = key;
    if (!at) { at = Math.min(key, Date.now()); approx = true; }
    if (!replayDate) saveSeen(firstSeen);
    const card = feedCard(g, x, isNew, at, approx);
    card._k = at;
    const before = [...feed.children].find((c) => c._k < at);
    feed.insertBefore(card, before || null);
    seen.set(`${g.key}|${x.id}`, card);
  }

  // Apply one snapshot of today's rival games. `wall` orders goals that arrive now.
  function update(games, wall) {
    let newGoal = false;
    const keys = new Set(games.map((g) => g.key));
    // A new day: yesterday's games drop off.
    for (const [key, st] of shown) {
      if (keys.has(key)) continue;
      st.row.remove();
      feed.querySelectorAll(`[data-game="${key}"]`).forEach((c) => { c.dataset.gone = "1"; c.remove(); });
      shown.delete(key);
    }
    for (const g of games) {
      if (!shown.has(g.key)) {
        const row = document.createElement("div");
        row.className = "sbrow";
        sb.appendChild(row);
        shown.set(g.key, { g, row });
      }
      const st = shown.get(g.key), prevOs = st.g.os;
      st.g = g;
      // Re-render only on change, so pen marks don't redraw on every poll.
      const sig = `${status(g)}|${g.os}|${g.rs}`;
      if (st.sig !== sig) { st.row.innerHTML = sbRow(g, status(g), !first); st.sig = sig; }
      if (!first && g.os > prevOs) st.row.querySelector(".flap b")?.classList.add("go");
      for (const x of g.goals) {
        if (seen.has(`${g.key}|${x.id}`)) continue;
        addCard(g, x, !first, !first ? wall : replayDate ? wall - (100 - x.t) * 1000 : estWall(g, x));
        newGoal = true;
        if (!first) sr.textContent = `Goal against ${g.rival}: ${x.name}, ${ORD(x.per)} period ${x.clock}.`;
      }
      // Goals taken back on review.
      const ids = new Set(g.goals.map((x) => String(x.id)));
      feed.querySelectorAll(`[data-game="${g.key}"]`).forEach((c) => { if (!ids.has(c.dataset.goal)) { c.dataset.gone = "1"; c.remove(); seen.delete(`${g.key}|${c.dataset.goal}`); } });
    }
    first = false;
    renderFrame();
    const finals = games.filter((g) => FINAL.has(g.state)).map((g) => g.key);
    if (finals.length) onFinals?.(finals);
    return newGoal;
  }

  if (!replayDate) {
    const poll = async () => {
      clearTimeout(timer);
      let any = false;
      try {
        const res = await fetch(`/api/live?rivals=${rivals.join(",")}`);
        if (res.ok) { const d = await res.json(); update(d.games, Date.now()); any = d.anyLive || d.games.some((g) => g.state === "PRE"); }
      } catch { /* keep the last snapshot */ }
      if (!document.hidden) timer = setTimeout(poll, any ? 20000 : 300000);
    };
    document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); else clearTimeout(timer); });
    poll();
    return {};
  }

  // Replay: run a past night on a compressed clock (7-minute intermissions, staggered puck drops).
  fetch(`/api/live?rivals=${rivals.join(",")}&date=${replayDate}`).then((r) => r.json()).then((d) => {
    const games = d.games.filter((g) => FINAL.has(g.state));
    const t0 = Math.min(...games.map((g) => Date.parse(g.startUTC)));
    const INT = 7;
    const sims = games.map((g) => {
      const endT = Math.max(60, ...g.goals.map((x) => x.t), ...g.ours.map((t) => t));
      return { g, off: (Date.parse(g.startUTC) - t0) / 60000 / 3, endT };
    });
    // Regular-season overtime follows the third with no intermission.
    const clockAt = (e, endT) => {
      if (e < 0) return { pre: true, t: 0 };
      const ot = e - 2 * (20 + INT) - 20;
      if (ot >= 0) return 60 + ot >= endT ? { fin: true, t: endT } : { t: 60 + ot, per: 4 };
      const p = Math.floor(e / (20 + INT)), inP = e - p * (20 + INT);
      return inP >= 20 ? { int: p + 1, t: 20 * (p + 1) } : { t: 20 * p + inP, per: p + 1 };
    };
    let w = at;
    const tick = () => {
      w += 0.3;
      const frame = sims.map(({ g, off, endT }) => {
        const c = clockAt(w - off, endT), t = c.t;
        const goals = g.goals.filter((x) => x.t <= t), ours = g.ours.filter((x) => x <= t);
        const st = c.pre ? "PRE" : c.fin ? "OFF" : "LIVE";
        const left = c.per ? (c.per <= 3 ? 20 * c.per - t : 0) : 0;
        const label = c.pre ? "Pre-game" : c.fin ? (g.lp === "OT" ? "Final · OT" : g.lp === "SO" ? "Final · SO" : "Final") : c.int ? `${ORD(c.int)} INT` : c.per === 4 ? `OT · ${Math.floor(65 - t)}:${String(Math.round(((65 - t) % 1) * 60) % 60).padStart(2, "0")}` : `${ORD(c.per)} · ${Math.floor(left)}:${String(Math.round((left % 1) * 60) % 60).padStart(2, "0")}`;
        return { ...g, state: st, status: label, goals, ours, os: c.fin ? g.os : goals.length, rs: c.fin ? g.rs : ours.length };
      });
      const hold = update(frame, Date.now());
      if (frame.every((g) => g.state === "OFF")) return;
      timer = setTimeout(tick, hold ? 1500 : 140);
    };
    tick();
  });
  return {};
}
