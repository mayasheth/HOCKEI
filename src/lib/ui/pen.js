// Hand-drawn pen marks (circle, underline, check, cross, arrow), each slightly different, seeded per
// item. Red pen marks bad news for rivals; blue pen (good = true) marks good news for favorites.

export const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let x = seed || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
const between = (r, lo, hi) => lo + (hi - lo) * r();
const f2 = (n) => n.toFixed(2);
const jit = (r, d, amt) => d.replace(/-?\d+(\.\d+)?/g, (m) => f2(+m + between(r, -amt, amt)));

const PEN = {
  circle: ["0 0 26 26", "M16 3 C6 1 1 8 3 15 C5 23 18 25 23 17 C27 10 21 3 12 4", 1.1],
  under2: ["0 0 60 8", "M1 2 C20 1 40 2 59 2 M3 7 C22 6 40 6 57 7", 0.7],
  check: ["0 0 11 10", "M1 5.5 L4 8.6 L10 1.2", 0.5],
  cross: ["0 0 11 11", "M1.5 1.5 C4 4 7 7 9.5 9.5 M9.5 1.5 C7 4 4 7 1.5 9.5", 0.5],
  // Pointing left, at the thing it marks: shaft drawn from the tail, then the head.
  arrow: ["0 0 60 16", "M58 9 C44 7 26 10 6 8 M14 2 C10 4 7 6 4 8 C8 10 11 12 14 14", 1],
};

export function penSVG(kind, r, box, w, delay, good = false) {
  const [vb, d, amt] = PEN[kind];
  const cls = (kind === "circle" ? "pen sweep" : "pen wipe") + (good ? " good" : "");
  const a0 = kind === "circle" ? `--a0:${Math.round(between(r, 250, 320))}deg;` : "";
  const rot = kind === "circle" ? `transform:rotate(${f2(between(r, -7, 7))}deg);` : "";
  return `<svg class="${cls}" style="${box};${a0}${rot}animation-delay:${delay}s" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" style="stroke-width:${f2(w)}px" d="${jit(r, d, amt)}"></path></svg>`;
}

export const circled = (v, r, delay, good = false) =>
  `<span class="pw">${v}${penSVG("circle", r, "left:-.28em;top:-.12em;width:calc(100% + .56em);height:calc(100% + .22em)", 2.6, delay, good)}</span>`;

// Good or bad news at a glance: a red cross for a rival's misery, a blue tick for a favorite's joy.
export function newsMark(kind, r, delay = 0) {
  const one = (k, good) => `<span class="nmark" title="${good ? "Good news" : "Bad news"}">${penSVG(k, r, "left:0;top:0;width:100%;height:100%", 2.2, delay, good)}</span>`;
  const marks = kind === "both" ? one("cross", false) + one("check", true) : kind === "fav" ? one("check", true) : one("cross", false);
  return `<span class="nmarks">${marks}<span class="sr">${kind === "both" ? "Good and bad news" : kind === "fav" ? "Good news" : "Bad news"}</span></span>`;
}

// Scoreline dash drawn as a bar centred on the figures (many fonts set the en dash too low).
export const dashed = (t) => esc(t).replace(/(\d)–(?=\d)/g, '$1<span class="dash" aria-hidden="true"></span><span class="sr">–</span>');
