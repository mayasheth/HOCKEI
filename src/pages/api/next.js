import { next } from "../../lib/server/games.js";
import { rivalsParam, favsParam, json, fail } from "./_util.js";

// GET /api/next?rivals=TOR,NYR&favs=OTT -> each rival's next game with pre-game facts.
export async function GET({ url }) {
  const rivals = rivalsParam(url), favs = favsParam(url);
  if (!rivals.length && !favs.length) return json([]);
  try {
    return json(await next(rivals, favs), { maxAge: 600 });
  } catch (e) {
    return fail(e);
  }
}
