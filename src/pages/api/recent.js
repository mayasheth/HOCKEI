import { recent } from "../../lib/server/games.js";
import { rivalsParam, json, fail } from "./_util.js";

// GET /api/recent?rivals=TOR,NYR&offset=0&limit=6 -> finished rival games, newest first, with facts.
export async function GET({ url }) {
  const rivals = rivalsParam(url);
  if (!rivals.length) return json({ games: [], total: 0 });
  const offset = Math.max(0, +url.searchParams.get("offset") || 0);
  const limit = Math.min(12, Math.max(1, +url.searchParams.get("limit") || 6));
  try {
    return json(await recent(rivals, offset, limit), { maxAge: 300 });
  } catch (e) {
    return fail(e);
  }
}
