import { cached, getJSON } from "../../lib/server/nhl.js";
import { json, fail } from "./_util.js";

// GET /api/tracks?u=<pptReplayUrl>&r=TOR -> puck and skater paths for one goal (rink inches,
// every other frame), rotated so the scoring net is on the right. Only wsr.nhle.com sprites are allowed.
const SPRITE = /^https:\/\/wsr\.nhle\.com\/sprites\/\d{8}\/\d{10}\/ev\d+\.json$/;

export async function GET({ url }) {
  const u = url.searchParams.get("u") || "", rival = (url.searchParams.get("r") || "").toUpperCase();
  if (!SPRITE.test(u) || !/^[A-Z]{3}$/.test(rival)) return fail("Bad request", 400);
  try {
    const body = await cached(`trk:${u}:${rival}`, Infinity, async () => {
      const frames = await getJSON(u, { Referer: "https://www.nhl.com/" });
      const paths = new Map();
      for (const fr of frames) {
        for (const e of Object.values(fr.onIce || {})) {
          if (e.id == null || e.x == null) continue;
          if (!paths.has(e.id)) paths.set(e.id, { team: e.teamAbbrev || "", pts: [] });
          paths.get(e.id).pts.push([e.x, e.y]);
        }
      }
      const puck = paths.get(1);
      if (!puck || puck.pts.length < 5) throw new Error("No puck track");
      paths.delete(1);
      const flip = puck.pts[puck.pts.length - 1][0] < 1200;
      const tf = (pts) => pts.filter((_, i) => i % 2 === 0).map(([x, y]) => (flip ? [Math.round(2400 - x), Math.round(1020 - y)] : [Math.round(x), Math.round(y)]));
      const sk = [...paths.values()];
      return {
        puck: tf(puck.pts),
        rival: sk.filter((p) => p.team === rival).map((p) => tf(p.pts)),
        opp: sk.filter((p) => p.team && p.team !== rival).map((p) => tf(p.pts)),
      };
    });
    return json(body, { maxAge: 31536000 });
  } catch (e) {
    // Sprites appear a few minutes after a goal; the client retries.
    return fail(e, 404);
  }
}
