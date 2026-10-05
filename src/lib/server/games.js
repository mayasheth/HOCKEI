// Rival and favorite game data from the NHL API: schedules, per-game scoring sheets, and the fact engine.
// Rivals are covered through goals against and losses; favorites through goals for and wins.
import { api, cached, isFinal, isLive } from "./nhl.js";
import { factsFor, factsForFav, nextFacts, nextFactsFav, FACTS_VERSION } from "../facts.js";

const tmin = (per, clock) => {
  const [m, s] = clock.split(":").map(Number);
  return Math.round(((per - 1) * 20 + m + s / 60) * 100) / 100;
};
const shortClock = (c) => c.replace(/^0(\d)/, "$1");

function scheduleRow(g, team) {
  const home = g.homeTeam.abbrev === team;
  const me = home ? g.homeTeam : g.awayTeam, op = home ? g.awayTeam : g.homeTeam;
  const lp = g.gameOutcome?.lastPeriodType || "REG";
  const gf = me.score ?? 0, ga = op.score ?? 0;
  return {
    id: g.id, season: String(g.season), gameType: g.gameType, date: g.gameDate, startUTC: g.startTimeUTC,
    state: g.gameState, home, opp: op.abbrev, gf, ga, lp,
    res: !isFinal(g.gameState) ? null : gf > ga ? "W" : lp === "REG" ? "L" : "O",
  };
}

// Completed and upcoming games for one team over the current and previous season, oldest first.
// The season schedule is cached for 5 min, so today's games are overlaid from the live scoreboard.
export async function schedule(team) {
  const base = await cached(`sched:${team}`, 300, async () => {
    const cur = await api(`club-schedule-season/${team}/now`, 300);
    const prev = cur.previousSeason ? await api(`club-schedule-season/${team}/${cur.previousSeason}`, 86400).catch(() => ({ games: [] })) : { games: [] };
    const rows = [...prev.games, ...cur.games].filter((g) => g.gameType === 2 || g.gameType === 3).map((g) => scheduleRow(g, team));
    return { current: String(cur.currentSeason), previous: String(cur.previousSeason || ""), rows };
  });
  const today = await api("score/now", 10).catch(() => ({ games: [] }));
  const fresh = new Map((today.games || []).filter((g) => g.homeTeam.abbrev === team || g.awayTeam.abbrev === team).map((g) => [g.id, g]));
  if (!fresh.size) return base;
  return { ...base, rows: base.rows.map((r) => (fresh.has(r.id) ? { ...scheduleRow({ ...fresh.get(r.id), season: r.season, gameType: r.gameType, gameDate: r.date }, team) } : r)) };
}

// One game's scoring sheet from the rival's side. Finished games are cached for good.
const finishedPbp = new Map();
async function playByPlay(id) {
  if (finishedPbp.has(id)) return finishedPbp.get(id);
  const p = await api(`gamecenter/${id}/play-by-play`, 10);
  if (isFinal(p.gameState)) {
    finishedPbp.set(id, p);
    if (finishedPbp.size > 400) finishedPbp.delete(finishedPbp.keys().next().value);
  }
  return p;
}

// One game's scoring sheet from `team`'s side. side "against": `goals` are the goals it allowed
// and `ours` its own goal times (rival coverage). side "for": `goals` are its own goals and `ours`
// the opponent's goal times (favorite coverage). rs/os are always team/opponent scores.
export async function detail(id, team, side = "against") {
  const pbp = await playByPlay(id);
  const home = pbp.homeTeam.abbrev === team;
  const me = home ? pbp.homeTeam : pbp.awayTeam, op = home ? pbp.awayTeam : pbp.homeTeam;
  const names = new Map(pbp.rosterSpots.map((r) => [r.playerId, [r.firstName.default, r.lastName.default]]));
  const goals = [], ours = [];
  let mine = 0, theirs = 0;
  for (const e of pbp.plays) {
    if (e.typeDescKey !== "goal" || e.periodDescriptor.periodType === "SO") continue;
    const per = e.periodDescriptor.number, t = tmin(per, e.timeInPeriod), d = e.details || {};
    const byTeam = d.eventOwnerTeamId === me.id;
    if (byTeam !== (side === "for")) { byTeam ? mine++ : theirs++; ours.push(t); continue; }
    // situationCode: away goalie, away skaters, home skaters, home goalie. Tag from the scorer's side.
    const sit = e.situationCode || "1551";
    const scorerHome = byTeam ? home : !home;
    const en = (scorerHome ? sit[0] : sit[3]) === "0";
    const sk = +(scorerHome ? sit[2] : sit[1]), def = +(scorerHome ? sit[1] : sit[2]);
    const tag = en ? "EN" : sk > def ? "PP" : sk < def ? "SH" : "";
    const scorer = names.get(d.scoringPlayerId) || ["", "Unknown"];
    const goalie = names.get(d.goalieInNetId);
    goals.push({
      id: e.eventId, per, t, clock: shortClock(e.timeInPeriod), name: scorer[1], scorerId: d.scoringPlayerId,
      goalie: goalie ? goalie[1] : null, tag, ppt: e.pptReplayUrl || null, before: side === "for" ? [theirs, mine] : [mine, theirs],
    });
    byTeam ? mine++ : theirs++;
  }
  const state = pbp.gameState, lp = pbp.gameOutcome?.lastPeriodType || pbp.periodDescriptor?.periodType || "REG";
  const final = isFinal(state);
  // Severity: shorthanded, overtime, or a late winner is the biggest; power play, empty net or any winner next.
  // before = [other side's goals, scoring side's goals] at the time of the goal.
  const scorerTotal = side === "for" ? mine : theirs, otherTotal = side === "for" ? theirs : mine;
  for (const g of goals) {
    const gwg = final && scorerTotal > otherTotal && g.before[1] === otherTotal;
    g.sev = g.tag === "SH" || g.per >= 4 || (gwg && g.per >= 3) ? 60 : g.tag === "PP" || g.tag === "EN" || gwg ? 40 : 35;
    if (gwg) g.gwg = true;
  }
  return {
    id, rival: team, opp: op.abbrev, home, state, date: pbp.gameDate, startUTC: pbp.startTimeUTC,
    rs: me.score ?? mine, os: op.score ?? theirs, lp, period: pbp.periodDescriptor?.number || 0,
    clock: pbp.clock || null, goals, ours,
  };
}

// The team's goalie who faced the most shots, with his save percentage and the last time
// (as a starter facing 10+ shots) he did as badly or worse (or, with best, as well or better).
// since: a date, null if never in the window, "" if it happened within his last 10 starts.
async function goalieLine(id, team, date, seasons, best = false) {
  const box = await cached(`box:${id}`, Infinity, () => api(`gamecenter/${id}/boxscore`, 60));
  const side = box.homeTeam.abbrev === team ? "homeTeam" : "awayTeam";
  const g = [...(box.playerByGameStats?.[side]?.goalies || [])].sort((a, b) => (b.shotsAgainst || 0) - (a.shotsAgainst || 0))[0];
  if (!g || !g.shotsAgainst) return null;
  const sv = g.saves / g.shotsAgainst;
  const logs = await Promise.all(seasons.map((s) => api(`player/${g.playerId}/game-log/${s}/2`, 86400).then((d) => d.gameLog || []).catch(() => [])));
  const starts = logs.flat().filter((x) => x.gamesStarted && x.shotsAgainst >= 10 && x.gameDate < date).sort((a, b) => b.gameDate.localeCompare(a.gameDate));
  const k = starts.findIndex((x) => (best ? x.savePctg >= sv : x.savePctg <= sv));
  const since = k === -1 ? (starts.length >= 10 ? null : "") : k >= 10 ? starts[k].gameDate : "";
  return { name: g.name.default.replace(/^.*?\.\s*/, ""), sv, saves: g.saves, shots: g.shotsAgainst, lowestSince: since, since };
}

const kickerFor = (row, rows) => {
  const parts = ["Final" + (row.lp === "OT" ? " · OT" : row.lp === "SO" ? " · SO" : "")];
  const season = rows.filter((r) => r.season === row.season && r.gameType === 2);
  if (row.gameType === 3) parts.push("Playoffs");
  else if (season[0]?.id === row.id) parts.push("Season opener");
  else if (row.home && season.find((r) => r.home)?.id === row.id) parts.push("Home opener");
  return parts.join(" · ");
};

const strip = (goals) => goals.map(({ before, scorerId, goalie, ...g }) => g);

// A finished game, ready to render: scoring sheet, kicker, and up to four facts.
// role "rival": goals against and misery stats. role "fav": goals for and good-news stats.
export async function finishedGame(team, id, role = "rival") {
  return cached(`game:v${FACTS_VERSION}:${role}:${team}:${id}`, Infinity, async () => {
    const side = role === "fav" ? "for" : "against";
    const sch = await schedule(team);
    const idx = sch.rows.findIndex((r) => r.id === id);
    const row = sch.rows[idx], d = await detail(id, team, side);
    const upto = sch.rows.slice(0, idx + 1).filter((r) => r.res);
    // Previous meetings with this opponent, for "goals vs" facts.
    const meetings = upto.filter((r) => r.opp === row.opp).slice(-8);
    const vs = await Promise.all(meetings.map((r) => (r.id === id ? d : detail(r.id, team, side))));
    const goalie = await goalieLine(id, team, row.date, [sch.previous, sch.current].filter(Boolean), role === "fav").catch(() => null);
    const args = { team, row, upto, detail: d, vs, since: sch.previous || sch.current, goalie };
    const { stats, deck } = role === "fav" ? factsForFav(args) : factsFor(args);
    return {
      key: `${role}-${team}-${id}`, role, id, rival: team, opp: row.opp, date: row.date, kicker: kickerFor(row, sch.rows),
      rs: d.rs, os: d.os, goals: strip(d.goals), ours: d.ours, stats, deck,
    };
  });
}

// Finished games newest first, paged over candidates: rival losses, favorite wins, and rival
// wins that still carry a bad stat. A favorite beating a rival is one "both" item.
// Favorite losses are never shown.
export async function recent(rivals, favs, offset, limit) {
  const byGame = new Map();
  const add = (t, r, role) => {
    if (!byGame.has(r.id)) byGame.set(r.id, { id: r.id, startUTC: r.startUTC, parts: [] });
    byGame.get(r.id).parts.push({ t, r, role });
  };
  for (const t of rivals) (await schedule(t)).rows.filter((r) => r.res).forEach((r) => add(t, r, "rival"));
  for (const t of favs) (await schedule(t)).rows.filter((r) => r.res === "W").forEach((r) => add(t, r, "fav"));
  // A favorite's win over a rival leaves the rival's row as a loss; a rival's win over a favorite is dropped.
  const cands = [...byGame.values()].filter((c) => !(c.parts.length === 1 && c.parts[0].role === "rival" && c.parts[0].r.res === "W" && favs.includes(c.parts[0].r.opp)));
  cands.sort((a, b) => b.startUTC.localeCompare(a.startUTC) || a.id - b.id);
  const page = cands.slice(offset, offset + limit);
  const built = await Promise.all(page.map(async (c) => {
    try {
      const parts = await Promise.all(c.parts.map((p) => finishedGame(p.t, p.r.id, p.role)));
      // Two rivals meeting: cover the one that lost.
      const rivals = parts.filter((g) => g.role === "rival").sort((x, y) => (y.os - y.rs) - (x.os - x.rs));
      const rival = rivals[0], fav = parts.find((g) => g.role === "fav");
      if (rival && fav) return { key: `both-${c.id}`, role: "both", id: c.id, date: fav.date, rival, fav };
      if (rival && rival.os <= rival.rs && !rival.stats.length) return null; // rival won, nothing bad to say
      return rival || fav;
    } catch { return null; }
  }));
  return { games: built.filter(Boolean), nextOffset: offset + page.length, total: cands.length };
}

// Tonight's (or a given date's) games for followed teams, as scoring sheets: one entry per followed
// team per game (role "rival" lists goals against, role "fav" goals for).
// The NHL's "now" scoreboard keeps last night's slate until well into the next day. Once every
// game on it is over and Eastern time has moved to a new date, switch to today's slate.
const easternDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

export async function live(rivals, favs, date) {
  let day = await api(`score/${date || "now"}`, date ? 3600 : 10);
  const today = easternDate();
  if (!date && day.currentDate < today && (day.games || []).every((g) => isFinal(g.gameState))) day = await api(`score/${today}`, 60);
  const out = [];
  for (const g of day.games || []) {
    for (const t of [g.homeTeam.abbrev, g.awayTeam.abbrev]) {
      const role = rivals.includes(t) ? "rival" : favs.includes(t) ? "fav" : null;
      if (!role) continue;
      const base = { key: `${role}-${t}-${g.id}`, role, id: g.id, rival: t, home: t === g.homeTeam.abbrev, opp: t === g.homeTeam.abbrev ? g.awayTeam.abbrev : g.homeTeam.abbrev };
      if (g.gameState === "FUT" || g.gameState === "PRE") {
        out.push({ ...base, state: g.gameState, startUTC: g.startTimeUTC, rs: 0, os: 0, goals: [], ours: [] });
        continue;
      }
      const d = await detail(g.id, t, role === "fav" ? "for" : "against");
      out.push({ ...d, ...base, goals: strip(d.goals) });
    }
  }
  return { date: date || (day.currentDate < today ? day.currentDate : today), games: out, anyLive: out.some((g) => isLive(g.state)) };
}

// Each followed team's next game, with pre-game facts.
export async function next(rivals, favs) {
  const out = [];
  for (const [t, role] of [...rivals.map((t) => [t, "rival"]), ...favs.map((t) => [t, "fav"])]) {
    const sch = await schedule(t);
    const i = sch.rows.findIndex((r) => r.state === "FUT" || r.state === "PRE");
    if (i < 0) continue;
    const row = sch.rows[i], done = sch.rows.slice(0, i).filter((r) => r.res);
    const args = { row, done, since: sch.previous || sch.current };
    out.push({ rival: t, role, opp: row.opp, home: row.home, date: row.date, startUTC: row.startUTC, facts: role === "fav" ? nextFactsFav(args) : nextFacts(args) });
  }
  return out.sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}
