import { live } from "../../lib/server/games.js";
import { rivalsParam, json, fail } from "./_util.js";

// GET /api/live?rivals=TOR,NYR[&date=YYYY-MM-DD] -> today's (or that date's) rival games with goals against.
export async function GET({ url }) {
  const rivals = rivalsParam(url);
  const date = url.searchParams.get("date");
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Bad date", 400);
  if (!rivals.length) return json({ games: [], anyLive: false });
  try {
    const body = await live(rivals, date);
    return json(body, { maxAge: date ? 3600 : body.anyLive ? 10 : 60 });
  } catch (e) {
    return fail(e);
  }
}
