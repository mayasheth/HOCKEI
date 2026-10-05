// The fact engine: hyperspecific, earnest stats about a rival's game, computed only from
// the NHL schedule and play-by-play. Rules are tried in priority order; the first four that
// apply are shown. Several began as the old "curses" (home/road streaks, back-to-backs,
// one-goal games, blowouts, weekday droughts).

// Bump when rules change so cached game summaries are rebuilt.
export const FACTS_VERSION = 5;

export const nth = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
export const seasonLabel = (s) => `${s.slice(0, 4)}–${s.slice(6)}`;
const mmss = (m) => { const s = Math.round(m * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (iso) => DAY[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 864e5);
const lostBy = (r) => r.ga - r.gf;

function trailing(rows, test) {
  let n = 0;
  for (let i = rows.length - 1; i >= 0 && test(rows[i]); i--) n++;
  return n;
}
function b2bRecord(rows) {
  let w = 0, l = 0;
  for (let i = 1; i < rows.length; i++) {
    if (daysBetween(rows[i - 1].date, rows[i].date) !== 1) continue;
    rows[i].res === "W" ? w++ : l++;
  }
  return { w, l };
}
function oneGoal(rows) {
  const last = rows.slice(-20).filter((r) => Math.abs(r.gf - r.ga) === 1);
  return { w: last.filter((r) => r.res === "W").length, l: last.filter((r) => r.res !== "W").length };
}
// Games on this weekday since the last win on it (so the off-season doesn't inflate it), or null if no win in the data.
function weekdayDrought(rows, iso) {
  const day = weekday(iso), on = rows.filter((r) => weekday(r.date) === day && r.date < iso);
  const n = trailing(on, (r) => r.res !== "W");
  return n < on.length ? { day, n, since: on[on.length - n - 1].date } : null;
}
const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function factsFor({ team, row, upto, detail, vs, since, goalie }) {
  const out = [], lost = row.res !== "W", S = seasonLabel(since);
  const add = (big, l, s = "") => out.push({ big: String(big), l, s });
  const goals = detail.goals;

  const winless = trailing(upto, (r) => r.res !== "W");
  if (lost && winless >= 3) add(nth(winless), "Straight game without a win");

  const place = upto.filter((r) => r.home === row.home);
  const placeStreak = trailing(place, (r) => r.res !== "W");
  if (lost && placeStreak >= 3 && placeStreak !== winless) add(nth(placeStreak), `Straight ${row.home ? "home" : "road"} game without a win`);

  if (row.gf === 0) add(nth(upto.filter((r) => r.gf === 0).length), `Shutout since ${S}`);

  if (lost && row.ga >= 4) {
    const prior = upto.slice(0, -1), prev = [...prior].reverse().find((r) => r.ga >= row.ga);
    if (!prev) add(row.ga, `Goals against, most since ${S}`);
    else if (prior.length - prior.indexOf(prev) >= 15) add(row.ga, "Goals against", `Most since ${shortDate(prev.date)}`);
  }

  // The rival's main goalie, when his save percentage was poor: ".815" with saves on shots, or how long since he was this bad.
  if (lost && goalie && goalie.shots >= 10 && goalie.sv < 0.88) {
    const sv = goalie.sv.toFixed(3).replace(/^0/, "");
    const low = goalie.lowestSince === null ? `His lowest since ${S}` : goalie.lowestSince ? `His lowest since ${shortDate(goalie.lowestSince)}` : "";
    add(sv, `Save percentage, ${goalie.name}`, low || `${goalie.saves} saves on ${goalie.shots} shots`);
  }

  const ts = goals.map((g) => g.t).sort((a, b) => a - b);
  if (ts.length >= 3) {
    const w = Math.min(...ts.slice(0, -2).map((t, i) => ts[i + 2] - t));
    if (w <= 5) add(mmss(w), "Three goals against", "");
  } else if (ts.length === 2 && ts[1] - ts[0] <= 1.5) add(mmss(ts[1] - ts[0]), "Between the two goals against");

  const scored = new Map();
  vs.forEach((d) => d.goals.forEach((g) => scored.set(g.scorerId, (scored.get(g.scorerId) || 0) + 1)));
  const tonight = goals.filter((g) => g.scorerId).sort((a, b) => (scored.get(b.scorerId) || 0) - (scored.get(a.scorerId) || 0))[0];
  if (tonight && scored.get(tonight.scorerId) >= 3) add(scored.get(tonight.scorerId), `${tonight.name} goals vs ${team} since ${S}`, `In ${vs.length} meetings`);

  const meet = upto.filter((r) => r.opp === row.opp).slice(-4);
  const mw = meet.filter((r) => r.res === "W").length;
  if (lost && meet.length >= 3 && mw <= 1) add(`${mw}–${meet.filter((r) => r.res === "L").length}–${meet.filter((r) => r.res === "O").length}`, `${team}, last ${meet.length} vs ${row.opp}`);

  if (lost && lostBy(row) >= 3) {
    const n = upto.filter((r) => r.season === row.season && lostBy(r) >= 3).length;
    if (n >= 2) add(nth(n), "Loss by three or more this season");
  }

  if (lost && Math.abs(row.gf - row.ga) === 1) {
    const { w, l } = oneGoal(upto);
    if (w + l >= 6 && l / (w + l) >= 0.6) add(`${w}–${l}`, "Record in one-goal games", "Last 20 games");
  }

  const prevRow = upto[upto.length - 2];
  if (lost && prevRow && daysBetween(prevRow.date, row.date) === 1) {
    const { w, l } = b2bRecord(upto);
    if (l >= w && w + l >= 3) add(`${w}–${l}`, `Second game of a back-to-back, since ${S}`);
  }

  if (lost) {
    const dr = weekdayDrought(upto.slice(0, -1), row.date);
    if (dr && dr.n + 1 >= 4) add(nth(dr.n + 1), `Straight ${dr.day} game without a win`, `Last ${dr.day} win: ${shortDate(dr.since)}`);
  }

  // Deck: how long the rival's last lead lasted, if it was blown.
  let deck = "";
  if (lost && detail.ours.length) {
    const evs = [...detail.ours.map((t) => ({ t, us: 1 })), ...goals.map((g) => ({ t: g.t }))].sort((a, b) => a.t - b.t);
    let rs = 0, os = 0, leadAt = null, lead = null;
    for (const e of evs) {
      e.us ? rs++ : os++;
      if (rs > os && leadAt == null) { leadAt = e.t; lead = `${rs}–${os}`; }
      if (rs <= os && leadAt != null) { deck = `${team}’s ${lead} lead lasted ${mmss(e.t - leadAt)}.`; leadAt = null; }
    }
  }
  return { stats: out.slice(0, 4), deck };
}

// Pre-game facts for a rival's next game.
export function nextFacts({ row, done, since }) {
  const out = [], S = seasonLabel(since);
  const winless = trailing(done, (r) => r.res !== "W");
  if (winless >= 3) out.push(`Winless in ${winless}`);
  const place = trailing(done.filter((r) => r.home === row.home), (r) => r.res !== "W");
  if (place >= 3 && place !== winless) out.push(`Winless in ${place} straight ${row.home ? "at home" : "on the road"}`);
  const last = done[done.length - 1];
  if (last && daysBetween(last.date, row.date) === 1) {
    const { w, l } = b2bRecord(done);
    out.push(`2nd of a back-to-back${w + l >= 3 && l >= w ? `: ${w}–${l} in those since ${S}` : ""}`);
  }
  const dr = weekdayDrought(done, row.date);
  if (dr && dr.n >= 3) out.push(`Winless in ${dr.n} straight ${dr.day} games`);
  return out.slice(0, 2);
}

// Good news for a favorite's win: streaks, big nights, the goalie, comebacks.
export function factsForFav({ team, row, upto, detail, vs, since, goalie }) {
  const out = [], S = seasonLabel(since);
  const add = (big, l, s = "") => out.push({ big: String(big), l, s });
  const goals = detail.goals;

  const streak = trailing(upto, (r) => r.res === "W");
  if (streak >= 2) add(nth(streak), "Straight win");
  const place = trailing(upto.filter((r) => r.home === row.home), (r) => r.res === "W");
  if (place >= 3 && place !== streak) add(nth(place), `Straight ${row.home ? "home" : "road"} win`);

  if (row.ga === 0) add(nth(upto.filter((r) => r.ga === 0).length), `Shutout since ${S}`, goalie ? `${goalie.saves} saves, ${goalie.name}` : "");
  else if (goalie && goalie.shots >= 20 && goalie.sv >= 0.94) {
    const best = goalie.since === null ? `His best since ${S}` : goalie.since ? `His best since ${shortDate(goalie.since)}` : "";
    add(goalie.sv.toFixed(3).replace(/^0/, ""), `Save percentage, ${goalie.name}`, best || `${goalie.saves} saves on ${goalie.shots} shots`);
  }

  const by = new Map();
  goals.forEach((g) => by.set(g.name, (by.get(g.name) || 0) + 1));
  const [star, k] = [...by.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  if (k >= 2) add(k, `${star} goals`, k === 3 ? "Hat trick" : "");

  if (row.gf >= 5) {
    const prior = upto.slice(0, -1), prev = [...prior].reverse().find((r) => r.gf >= row.gf);
    if (!prev) add(row.gf, `Goals, most since ${S}`);
    else if (prior.length - prior.indexOf(prev) >= 15) add(row.gf, "Goals", `Most since ${shortDate(prev.date)}`);
  }

  const scored = new Map();
  vs.forEach((d) => d.goals.forEach((g) => scored.set(g.scorerId, (scored.get(g.scorerId) || 0) + 1)));
  const top = goals.filter((g) => g.scorerId).sort((a, b) => (scored.get(b.scorerId) || 0) - (scored.get(a.scorerId) || 0))[0];
  if (top && scored.get(top.scorerId) >= 4) add(scored.get(top.scorerId), `${top.name} goals vs ${row.opp} since ${S}`, `In ${vs.length} meetings`);

  const meet = upto.filter((r) => r.opp === row.opp).slice(-4);
  const mw = meet.filter((r) => r.res === "W").length;
  if (meet.length >= 3 && mw >= meet.length - 1) add(`${mw}–${meet.filter((r) => r.res === "L").length}–${meet.filter((r) => r.res === "O").length}`, `${team}, last ${meet.length} vs ${row.opp}`);

  // Deck: a comeback, or the overtime winner.
  let deck = "";
  const evs = [...goals.map((g) => ({ t: g.t, us: 1 })), ...detail.ours.map((t) => ({ t }))].sort((a, b) => a.t - b.t);
  let f = 0, a = 0, worst = 0, at = "";
  for (const e of evs) { e.us ? f++ : a++; if (a - f > worst) { worst = a - f; at = `${f}–${a}`; } }
  if (worst >= 2) deck = `Came back from ${at}.`;
  const ot = goals.find((g) => g.per >= 4);
  if (ot) deck = `${deck ? deck + " " : ""}${ot.name} won it ${ot.clock} into overtime.`;
  return { stats: out.slice(0, 4), deck };
}

export function nextFactsFav({ row, done }) {
  const out = [];
  const streak = trailing(done, (r) => r.res === "W");
  if (streak >= 2) out.push(`Won ${streak} straight`);
  const place = trailing(done.filter((r) => r.home === row.home), (r) => r.res === "W");
  if (place >= 3 && place !== streak) out.push(`Won ${place} straight ${row.home ? "at home" : "on the road"}`);
  return out.slice(0, 2);
}
