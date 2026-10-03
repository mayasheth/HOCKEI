// Rival game data from the NHL API: schedules, per-game scoring sheets, and the fact engine.
import { api, cached, isFinal, isLive } from "./nhl.js";
import { factsFor, nextFacts } from "../facts.js";

const tmin = (per, clock) => {
  const [m, s] = clock.split(":").map(Number);
  return Math.round(((per - 1) * 20 + m + s / 60) * 100) / 100;
};
const shortClock = (c) => c.replace(/^0(\d)/, "$1");

// Completed and upcoming games for one team over the current and previous season, oldest first.
export async function schedule(team) {
  return cached(`sched:${team}`, 300, async () => {
    const cur = await api(`club-schedule-season/${team}/now`, 300);
    const prev = cur.previousSeason ? await api(`club-schedule-season/${team}/${cur.previousSeason}`, 86400).catch(() => ({ games: [] })) : { games: [] };
    const rows = [...prev.games, ...cur.games]
      .filter((g) => g.gameType === 2 || g.gameType === 3)
      .map((g) => {
        const home = g.homeTeam.abbrev === team;
        const me = home ? g.homeTeam : g.awayTeam, op = home ? g.awayTeam : g.homeTeam;
        const lp = g.gameOutcome?.lastPeriodType || "REG";
        const gf = me.score ?? 0, ga = op.score ?? 0;
        return {
          id: g.id, season: String(g.season), gameType: g.gameType, date: g.gameDate, startUTC: g.startTimeUTC,
          state: g.gameState, home, opp: op.abbrev, gf, ga, lp,
          res: !isFinal(g.gameState) ? null : gf > ga ? "W" : lp === "REG" ? "L" : "O",
        };
      });
    return { current: String(cur.currentSeason), previous: String(cur.previousSeason || ""), rows };
  });
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

export async function detail(id, team) {
  const pbp = await playByPlay(id);
  const home = pbp.homeTeam.abbrev === team;
  const me = home ? pbp.homeTeam : pbp.awayTeam, op = home ? pbp.awayTeam : pbp.homeTeam;
  const names = new Map(pbp.rosterSpots.map((r) => [r.playerId, [r.firstName.default, r.lastName.default]]));
  const goals = [], ours = [];
  let rs = 0, os = 0;
  for (const e of pbp.plays) {
    if (e.typeDescKey !== "goal" || e.periodDescriptor.periodType === "SO") continue;
    const per = e.periodDescriptor.number, t = tmin(per, e.timeInPeriod), d = e.details || {};
    if (d.eventOwnerTeamId === me.id) { rs++; ours.push(t); continue; }
    // situationCode: away goalie, away skaters, home skaters, home goalie
    const sit = e.situationCode || "1551";
    const en = (home ? sit[3] : sit[0]) === "0";
    const mine = +(home ? sit[2] : sit[1]), theirs = +(home ? sit[1] : sit[2]);
    const tag = en ? "EN" : theirs > mine ? "PP" : theirs < mine ? "SH" : "";
    const scorer = names.get(d.scoringPlayerId) || ["", "Unknown"];
    const goalie = names.get(d.goalieInNetId);
    goals.push({
      id: e.eventId, per, t, clock: shortClock(e.timeInPeriod), name: scorer[1], scorerId: d.scoringPlayerId,
      goalie: goalie ? goalie[1] : null, tag, ppt: e.pptReplayUrl || null, before: [rs, os],
    });
    os++;
  }
  const state = pbp.gameState, lp = pbp.gameOutcome?.lastPeriodType || pbp.periodDescriptor?.periodType || "REG";
  const final = isFinal(state);
  // Severity: shorthanded, or the winner late, is the worst; power play, empty net or any winner next.
  for (const g of goals) {
    const gwg = final && os > rs && g.before[1] === rs;
    g.sev = g.tag === "SH" || (gwg && g.per >= 3) ? 60 : g.tag === "PP" || g.tag === "EN" || gwg ? 40 : 35;
  }
  return {
    id, rival: team, opp: op.abbrev, home, state, date: pbp.gameDate, startUTC: pbp.startTimeUTC,
    rs: me.score ?? rs, os: op.score ?? os, lp, period: pbp.periodDescriptor?.number || 0,
    clock: pbp.clock || null, goals, ours,
  };
}

const kickerFor = (row, rows) => {
  const parts = ["Final" + (row.lp === "OT" ? " · OT" : row.lp === "SO" ? " · SO" : "")];
  const season = rows.filter((r) => r.season === row.season && r.gameType === 2);
  if (row.gameType === 3) parts.push("Playoffs");
  else if (season[0]?.id === row.id) parts.push("Season opener");
  else if (row.home && season.find((r) => r.home)?.id === row.id) parts.push("Home opener");
  return parts.join(" · ");
};

// A finished rival game, ready to render: scoring sheet, kicker, and up to four facts.
export async function finishedGame(team, id) {
  return cached(`game:${team}:${id}`, Infinity, async () => {
    const sch = await schedule(team);
    const idx = sch.rows.findIndex((r) => r.id === id);
    const row = sch.rows[idx], d = await detail(id, team);
    const upto = sch.rows.slice(0, idx + 1).filter((r) => r.res);
    // Previous meetings with this opponent, for "goals vs" facts.
    const meetings = upto.filter((r) => r.opp === row.opp).slice(-8);
    const vs = await Promise.all(meetings.map((r) => (r.id === id ? d : detail(r.id, team))));
    const { stats, deck } = factsFor({ team, row, upto, detail: d, vs, since: sch.previous || sch.current });
    return {
      key: `${team}-${id}`, id, rival: team, opp: row.opp, date: row.date, kicker: kickerFor(row, sch.rows),
      rs: d.rs, os: d.os, goals: d.goals.map(({ before, scorerId, goalie, ...g }) => g), ours: d.ours, stats, deck,
    };
  });
}

// Finished games for these rivals, newest first, paged.
export async function recent(rivals, offset, limit) {
  const all = [];
  for (const t of rivals) {
    const sch = await schedule(t);
    sch.rows.filter((r) => r.res).forEach((r) => all.push({ t, r }));
  }
  all.sort((a, b) => b.r.startUTC.localeCompare(a.r.startUTC) || a.t.localeCompare(b.t));
  const page = all.slice(offset, offset + limit);
  const games = await Promise.all(page.map(({ t, r }) => finishedGame(t, r.id).catch((e) => ({ key: `${t}-${r.id}`, error: String(e) }))));
  return { games: games.filter((g) => !g.error), total: all.length };
}

// Tonight's (or a given date's) rival games, as scoring sheets.
export async function live(rivals, date) {
  const day = await api(`score/${date || "now"}`, date ? 3600 : 10);
  const out = [];
  for (const g of day.games || []) {
    for (const t of [g.homeTeam.abbrev, g.awayTeam.abbrev]) {
      if (!rivals.includes(t)) continue;
      if (g.gameState === "FUT" || g.gameState === "PRE") {
        out.push({ key: `${t}-${g.id}`, id: g.id, rival: t, home: t === g.homeTeam.abbrev, opp: t === g.homeTeam.abbrev ? g.awayTeam.abbrev : g.homeTeam.abbrev, state: g.gameState, startUTC: g.startTimeUTC, rs: 0, os: 0, goals: [], ours: [] });
        continue;
      }
      const d = await detail(g.id, t);
      out.push({ key: `${t}-${g.id}`, ...d, goals: d.goals.map(({ before, scorerId, goalie, ...x }) => x) });
    }
  }
  return { date: day.currentDate || date, games: out, anyLive: out.some((g) => isLive(g.state)) };
}

// Each rival's next game, with pre-game facts.
export async function next(rivals) {
  const out = [];
  for (const t of rivals) {
    const sch = await schedule(t);
    const i = sch.rows.findIndex((r) => !r.res);
    if (i < 0) continue;
    const row = sch.rows[i], done = sch.rows.slice(0, i).filter((r) => r.res);
    out.push({ rival: t, opp: row.opp, home: row.home, date: row.date, startUTC: row.startUTC, facts: nextFacts({ row, done, since: sch.previous || sch.current }) });
  }
  return out.sort((a, b) => a.startUTC.localeCompare(b.startUTC));
}
