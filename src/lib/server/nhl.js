// Server-side NHL fetches. api-web.nhle.com returns 403 without a browser User-Agent,
// and wsr.nhle.com (tracking sprites) also needs an nhl.com Referer.
export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const API = "https://api-web.nhle.com/v1";

// Per-instance memory cache. Finished games never change, so callers pass ttl = Infinity for them.
const mem = new Map();

export async function cached(key, ttlSec, load) {
  const hit = mem.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = await load();
  mem.set(key, { value, until: ttlSec === Infinity ? Infinity : Date.now() + ttlSec * 1000 });
  if (mem.size > 2000) mem.delete(mem.keys().next().value);
  return value;
}

export async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export const api = (path, ttlSec = 60) => cached(`api:${path}`, ttlSec, () => getJSON(`${API}/${path}`));

export const isFinal = (state) => state === "OFF" || state === "FINAL";
export const isLive = (state) => state === "LIVE" || state === "CRIT";
