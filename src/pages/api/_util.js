// Shared helpers for HOCKEI API routes.
const TEAM = /^[A-Z]{3}$/;

export function rivalsParam(url, name = "rivals") {
  return [...new Set((url.searchParams.get(name) || "").toUpperCase().split(",").filter((t) => TEAM.test(t)))].slice(0, 32);
}
// Favorites, minus any team also listed as a rival.
export function favsParam(url) {
  const r = new Set(rivalsParam(url));
  return rivalsParam(url, "favs").filter((t) => !r.has(t));
}

export function json(body, { status = 200, maxAge = 60 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${Math.min(maxAge, 60)}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}` },
  });
}

export const fail = (e, status = 502) => json({ error: String(e?.message || e) }, { status, maxAge: 0 });
