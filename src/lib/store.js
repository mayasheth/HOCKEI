/**
 * Followed teams, kept in localStorage: rivals (bad news) and favorites (good news).
 * A team is one or the other, never both.
 */

const RIVALS_KEY = "rival-watch-rivals";
const FAVS_KEY = "hockei-favorites";

function read(key) {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(key);
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // Invalid stored data
  }
  return new Set();
}
function write(key, set) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* private mode */ }
}

/** @returns {Set<string>} */
export const getSelectedRivals = () => read(RIVALS_KEY);
/** @returns {Set<string>} */
export const getFavorites = () => {
  const r = getSelectedRivals();
  return new Set([...read(FAVS_KEY)].filter((t) => !r.has(t)));
};

/** @returns {"rival" | "fav" | null} */
export function roleOf(team) {
  if (getSelectedRivals().has(team)) return "rival";
  if (getFavorites().has(team)) return "fav";
  return null;
}

/**
 * Set a team's role.
 * @param {string} team
 * @param {"rival" | "fav" | null} role
 */
export function setRole(team, role) {
  const r = getSelectedRivals(), f = read(FAVS_KEY);
  r.delete(team);
  f.delete(team);
  if (role === "rival") r.add(team);
  if (role === "fav") f.add(team);
  write(RIVALS_KEY, r);
  write(FAVS_KEY, f);
}

/** Cycle none -> rival -> favorite -> none. */
export function cycleRole(team) {
  const next = { null: "rival", rival: "fav", fav: null }[String(roleOf(team))];
  setRole(team, next);
  return next;
}

export function clearAll() {
  write(RIVALS_KEY, new Set());
  write(FAVS_KEY, new Set());
}
