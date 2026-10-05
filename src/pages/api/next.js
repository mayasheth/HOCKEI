import { next } from "../../lib/server/games.js";
import { rivalsParam, json, fail } from "./_util.js";

// GET /api/next?rivals=TOR,NYR -> each rival's next game with pre-game facts.
export async function GET({ url }) {
  const rivals = rivalsParam(url);
  if (!rivals.length) return json([]);
  try {
    return json(await next(rivals), { maxAge: 600 });
  } catch (e) {
    return fail(e);
  }
}
