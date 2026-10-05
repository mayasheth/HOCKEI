// Live section ("Tonight"): a scoreboard row for every rival game today and one feed of goals
// against across all of them, newest first. Finished games stay (marked Final) and their goals
// keep sliding down as new ones arrive; they also join Recent. Polls every 20 s while games are
// live or about to start, 5 min otherwise, and pauses while the tab is hidden.
// `?replay=YYYY-MM-DD` replays a past night instead.
import { esc } from "./pen.js";
import { ORD, feedCard, soCard, soGood, sbRow, refreshAgo } from "./render.js";

const LIVE = new Set(["LIVE", "CRIT"]);
const FINAL = new Set(["OFF", "FINAL"]);
// "Tonight" only for today's slate; an earlier one reads "Last night" or its weekday.
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function slateLabel(date) {
  if (!date) return "Tonight";
  const now = new Date(), y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (date >= localISO(now)) return "Tonight";
  if (date === localISO(y)) return "Last night";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
const localTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const status = (g) => {
  if (g.status) return g.status;
  if (FINAL.has(g.state)) return g.lp === "OT" ? "Final · OT" : g.lp === "SO" ? "Final · SO" : "Final";
  if (g.state === "FUT") return localTime(g.startUTC);
  if (g.state === "PRE") return "Pre-game";
  if (g.ptype === "SO") return "Shootout";
  if (g.clock?.inIntermission) return `${ORD(g.period)} INT`;
  return `${ORD(g.period)} · ${g.clock?.timeRemaining?.replace(/^0(\d)/, "$1") || ""}`;
};
// Rough wall-clock time of a goal scored before the page first saw it: puck drop ~8 min after
// the listed start, ~1.6 real minutes per game minute, two 18-minute intermissions.
// Shootout attempts get a game time just past overtime, about 40 s apart.
const soT = (x) => 65 + x.n * 0.6;
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

export function startLive(root, rivals, favs, { replayDate, at = 0, onFinals, next = () => [] }) {
  const q = `rivals=${rivals.join(",")}&favs=${favs.join(",")}`;
  const shown = new Map(); // game id -> { entries, row }
  const seen = new Map(); // `${gameId}-${goalId}` -> card
  let first = true, timer = null, slateDate = null;

  root.innerHTML = `<h2 class="sechead" id="liveKick">Live</h2><div class="board" id="sb"></div><p class="sr" id="lvSr" aria-live="polite"></p><div class="feed" id="lvFeed"></div><div class="idle" id="lvIdle"></div>`;
  const sb = root.querySelector("#sb"), feed = root.querySelector("#lvFeed"), idle = root.querySelector("#lvIdle"), kick = root.querySelector("#liveKick"), sr = root.querySelector("#lvSr");

  function renderFrame() {
    const any = shown.size > 0, live = [...shown.values()].some((s) => LIVE.has(s.entries[0].state));
    kick.innerHTML = live ? '<span class="livedot"></span>Live' : any ? slateLabel(slateDate) : "Live";
    sb.hidden = !any;
    feed.hidden = !feed.children.length;
    idle.hidden = any;
    if (any) return;
    const nx = next();
    idle.innerHTML = `<p class="deck" style="margin:0">No rivals playing today.</p>${nx[0] ? `<p class="ag" style="margin:0;color:var(--mu)">Next: ${esc(new Date(nx[0].startUTC).toLocaleDateString("en-US", { weekday: "long" }))}, ${nx[0].rival} ${nx[0].home ? "vs" : "at"} ${nx[0].opp}</p>` : ""}`;
  }

  const firstSeen = replayDate ? {} : seenTimes();
  setInterval(() => refreshAgo(root), 30000);

  function addCard(g, x, isNew, key, favG, so = false) {
    const id = `${g.id}-${x.id}`;
    let at = firstSeen[id], approx = false;
    if (!at && isNew) at = firstSeen[id] = key;
    if (!at) { at = Math.min(key, Date.now()); approx = true; }
    if (!replayDate) saveSeen(firstSeen);
    const card = (so ? soCard : feedCard)(g, x, isNew, at, approx, favG);
    card._k = at;
    const before = [...feed.children].find((c) => c._k < at);
    feed.insertBefore(card, before || null);
    seen.set(id, card);
  }

  // Apply one snapshot of today's games. Entries come per followed team (role rival or fav);
  // a game with both becomes one row, and each of its goals one "both" card. `wall` orders new goals.
  function update(games, wall, date) {
    if (date) slateDate = date;
    let newGoal = false;
    const groups = new Map();
    games.forEach((g) => { if (!groups.has(g.id)) groups.set(g.id, []); groups.get(g.id).push(g); });
    // A new day: yesterday's games drop off.
    for (const [id, st] of shown) {
      if (groups.has(id)) continue;
      st.row.remove();
      feed.querySelectorAll(`[data-game="${id}"]`).forEach((c) => { c.dataset.gone = "1"; c.remove(); });
      shown.delete(id);
    }
    for (const [id, entries] of groups) {
      // Two rivals meeting: lead with the one trailing; each one's goals against still get cards.
      const rivalEs = entries.filter((e) => e.role !== "fav").sort((x, y) => (y.os - y.rs) - (x.os - x.rs));
      const rivalE = rivalEs[0], favE = entries.find((e) => e.role === "fav");
      const primary = rivalE || favE;
      if (!shown.has(id)) {
        const row = document.createElement("div");
        row.className = "sbrow";
        sb.appendChild(row);
        shown.set(id, { entries, row });
      }
      const st = shown.get(id), prevGoals = st.entries.reduce((n, e) => n + e.goals.length, 0);
      st.entries = entries;
      // Re-render only on change, so pen marks don't redraw on every poll.
      const sig = `${status(primary)}|${primary.os}|${primary.rs}`;
      if (st.sig !== sig) { st.row.innerHTML = sbRow(entries, status(primary), !first); st.sig = sig; }
      if (!first && entries.reduce((n, e) => n + e.goals.length, 0) > prevGoals) st.row.querySelector(".flap b")?.classList.add("go");
      const sources = rivalEs.length ? rivalEs : [favE];
      for (const src of sources) {
        for (const x of src.goals) {
          if (seen.has(`${id}-${x.id}`)) continue;
          addCard(src, x, !first, !first ? wall : replayDate ? wall - (100 - x.t) * 1000 : estWall(src, x), favE && src.role !== "fav" ? favE : undefined);
          newGoal = true;
          if (!first) sr.textContent = `${src.role === "fav" ? "Goal for" : "Goal against"} ${src.rival}: ${x.name}, ${ORD(x.per)} period ${x.clock}.`;
        }
        for (const x of (src.so || []).filter((x) => soGood(src, x))) {
          if (seen.has(`${id}-${x.id}`)) continue;
          const t = { t: soT(x), per: 4 };
          addCard(src, x, !first, !first ? wall : replayDate ? wall - (100 - t.t) * 1000 : estWall(src, t), favE && src.role !== "fav" ? favE : undefined, true);
          newGoal = true;
          if (!first) sr.textContent = `Shootout, round ${x.rd}: ${x.name} (${x.team}), ${x.res === "goal" ? "scored" : x.res === "save" ? "saved" : "no goal"}.`;
        }
      }
      // Goals taken back on review.
      const ids = new Set(sources.flatMap((e) => [...e.goals, ...(e.so || [])].map((x) => String(x.id))));
      feed.querySelectorAll(`[data-game="${id}"]`).forEach((c) => { if (!ids.has(c.dataset.goal)) { c.dataset.gone = "1"; c.remove(); seen.delete(`${id}-${c.dataset.goal}`); } });
    }
    first = false;
    renderFrame();
    // Finished games with good news (a rival lost, a favorite won) should appear in Recent.
    const finals = [];
    for (const [id, entries] of groups) {
      const rivalE = entries.filter((e) => e.role !== "fav").sort((x, y) => (y.os - y.rs) - (x.os - x.rs))[0], favE = entries.find((e) => e.role === "fav");
      const e = rivalE || favE;
      if (!FINAL.has(e.state)) continue;
      if (rivalE && favE && favE.rs > favE.os) finals.push(`both-${id}`);
      else if (rivalE && rivalE.os > rivalE.rs) finals.push(`rival-${rivalE.rival}-${id}`);
      else if (!rivalE && favE.rs > favE.os) finals.push(`fav-${favE.rival}-${id}`);
    }
    if (finals.length) onFinals?.(finals);
    return newGoal;
  }


  if (!replayDate) {
    const poll = async () => {
      clearTimeout(timer);
      let any = false;
      try {
        const res = await fetch(`/api/live?${q}`);
        if (res.ok) { const d = await res.json(); update(d.games, Date.now(), d.date); any = d.anyLive || d.games.some((g) => g.state === "PRE"); }
      } catch { /* keep the last snapshot */ }
      if (!document.hidden) timer = setTimeout(poll, any ? 20000 : 300000);
    };
    document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); else clearTimeout(timer); });
    poll();
    return {};
  }

  // Replay: run a past night on a compressed clock (7-minute intermissions, staggered puck drops).
  fetch(`/api/live?${q}&date=${replayDate}`).then((r) => r.json()).then((d) => {
    const games = d.games.filter((g) => FINAL.has(g.state));
    const t0 = Math.min(...games.map((g) => Date.parse(g.startUTC)));
    const INT = 7;
    const sims = games.map((g) => {
      const endT = g.so?.length ? soT(g.so[g.so.length - 1]) + 0.6 : Math.max(60, ...g.goals.map((x) => x.t), ...g.ours.map((t) => t));
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
        const goals = g.goals.filter((x) => x.t <= t), ours = g.ours.filter((x) => x <= t), so = (g.so || []).filter((x) => soT(x) <= t);
        const st = c.pre ? "PRE" : c.fin ? "OFF" : "LIVE";
        const left = c.per ? (c.per <= 3 ? 20 * c.per - t : 0) : 0;
        const label = c.pre ? "Pre-game" : c.fin ? (g.lp === "OT" ? "Final · OT" : g.lp === "SO" ? "Final · SO" : "Final") : c.int ? `${ORD(c.int)} INT` : c.per === 4 && t > 65 ? "Shootout" : c.per === 4 ? `OT · ${Math.floor(65 - t)}:${String(Math.round(((65 - t) % 1) * 60) % 60).padStart(2, "0")}` : `${ORD(c.per)} · ${Math.floor(left)}:${String(Math.round((left % 1) * 60) % 60).padStart(2, "0")}`;
        const fav = g.role === "fav";
        return { ...g, state: st, status: label, goals, ours, so, os: c.fin ? g.os : fav ? ours.length : goals.length, rs: c.fin ? g.rs : fav ? goals.length : ours.length };
      });
      const hold = update(frame, Date.now(), replayDate);
      if (frame.every((g) => g.state === "OFF")) return;
      timer = setTimeout(tick, hold ? 1500 : 140);
    };
    tick();
  });
  return {};
}
